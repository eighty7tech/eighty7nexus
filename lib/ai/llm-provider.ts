/**
 * Multi-Model LLM Provider Abstraction
 * Supports unified inference across OpenAI (GPT-4o), Anthropic Claude (Claude 3.5 Sonnet),
 * and self-hosted local Ollama instances with automatic fallback failover.
 */

import OpenAI from "openai";
import { DEFAULT_STORE_NAME } from "@/config/branding.config";

export type LLMProvider = "openai" | "anthropic" | "ollama";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMCompletionOptions {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
  ollamaBaseUrl?: string;
}

export interface LLMCompletionResponse {
  provider: LLMProvider;
  model: string;
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export async function generateLLMCompletion(
  messages: LLMMessage[],
  options: LLMCompletionOptions = {},
): Promise<LLMCompletionResponse> {
  const provider = options.provider || resolveDefaultProvider();

  try {
    switch (provider) {
      case "anthropic":
        return await completeWithAnthropic(messages, options);
      case "ollama":
        return await completeWithOllama(messages, options);
      case "openai":
      default:
        return await completeWithOpenAI(messages, options);
    }
  } catch (error) {
    console.warn(`Primary LLM provider (${provider}) failed, attempting fallback:`, error);
    // Fallback: If Anthropic or Ollama fails, try OpenAI. If OpenAI fails, return structured mock
    if (provider !== "openai" && process.env.OPENAI_API_KEY) {
      return await completeWithOpenAI(messages, options);
    }
    return generateMockCompletion(messages, options);
  }
}

function resolveDefaultProvider(): LLMProvider {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OLLAMA_BASE_URL) return "ollama";
  return "openai";
}

// 1. OpenAI Engine
async function completeWithOpenAI(
  messages: LLMMessage[],
  options: LLMCompletionOptions,
): Promise<LLMCompletionResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return generateMockCompletion(messages, options);
  }

  const client = new OpenAI({ apiKey });
  const model = options.model || "gpt-4o";

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1024,
    response_format: options.responseFormat === "json" ? { type: "json_object" } : undefined,
  });

  const content = response.choices[0]?.message?.content || "";
  return {
    provider: "openai",
    model,
    content,
    usage: {
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
      totalTokens: response.usage?.total_tokens,
    },
  };
}

// 2. Anthropic Claude Engine
async function completeWithAnthropic(
  messages: LLMMessage[],
  options: LLMCompletionOptions,
): Promise<LLMCompletionResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const model = options.model || "claude-3-5-sonnet-20241022";
  const systemMessage = messages.find((m) => m.role === "system")?.content || "";
  const conversationMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 1024,
      system: systemMessage,
      messages: conversationMessages,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as {
    content: Array<{ text: string }>;
    usage?: { input_tokens: number; output_tokens: number };
  };

  const content = data.content?.[0]?.text || "";
  return {
    provider: "anthropic",
    model,
    content,
    usage: {
      promptTokens: data.usage?.input_tokens,
      completionTokens: data.usage?.output_tokens,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    },
  };
}

// 3. Local Ollama Engine
async function completeWithOllama(
  messages: LLMMessage[],
  options: LLMCompletionOptions,
): Promise<LLMCompletionResponse> {
  const baseUrl = options.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = options.model || "llama3";

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      format: options.responseFormat === "json" ? "json" : undefined,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 1024,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ollama API error (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as {
    message?: { content: string };
    prompt_eval_count?: number;
    eval_count?: number;
  };

  const content = data.message?.content || "";
  return {
    provider: "ollama",
    model,
    content,
    usage: {
      promptTokens: data.prompt_eval_count,
      completionTokens: data.eval_count,
      totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
    },
  };
}

// 4. Mock / Offline Mode Generator
function generateMockCompletion(
  messages: LLMMessage[],
  options: LLMCompletionOptions,
): LLMCompletionResponse {
  const userPrompt = messages[messages.length - 1]?.content || "";
  const storeName = DEFAULT_STORE_NAME || "Eighty7Nexus";

  if (options.responseFormat === "json") {
    return {
      provider: "openai",
      model: "mock-offline",
      content: JSON.stringify({
        response: `Demonstration response for: ${userPrompt.substring(0, 40)}`,
        status: "success",
        recommendations: ["Product A", "Product B"],
      }),
    };
  }

  return {
    provider: "openai",
    model: "mock-offline",
    content: `[${storeName} AI Assistance] Thank you for your inquiry regarding "${userPrompt.substring(
      0,
      50,
    )}". Our catalog features high-quality items designed to exceed your expectations. Let us know if you need specific variant or shipping details.`,
  };
}
