import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateLLMCompletion, type LLMMessage, type LLMProvider } from "@/lib/ai/llm-provider";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages, provider, model, temperature, maxTokens, responseFormat } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 },
      );
    }

    const completion = await generateLLMCompletion(messages as LLMMessage[], {
      provider: provider as LLMProvider,
      model,
      temperature,
      maxTokens,
      responseFormat,
    });

    return NextResponse.json({ success: true, ...completion });
  } catch (error: unknown) {
    console.error("AI completion route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute LLM completion" },
      { status: 500 },
    );
  }
}
