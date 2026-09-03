/**
 * Multimodal Lifestyle Scene Studio
 * Transforms raw catalog product photos into studio-grade advertising visuals
 * using diffusion presets and prompt synthesis.
 */

import OpenAI from "openai";

export type LifestyleScenePreset =
  | "LUXURY_MARBLE"
  | "SCANDINAVIAN_MINIMAL"
  | "URBAN_STREET"
  | "TROPICAL_OUTDOOR"
  | "CYBERPUNK_NEON"
  | "STUDIO_PODIUM";

export interface LifestyleGenerationParams {
  productTitle: string;
  category?: string;
  description?: string;
  preset: LifestyleScenePreset;
  customPrompt?: string;
  resolution?: "1024x1024" | "1024x1792" | "1792x1024";
}

export interface LifestyleGenerationResult {
  preset: LifestyleScenePreset;
  promptUsed: string;
  imageUrl: string;
  revisedPrompt?: string;
  source: "DALLE3" | "MOCK_FALLBACK";
}

export const PRESET_BACKDROPS: Record<LifestyleScenePreset, string> = {
  LUXURY_MARBLE:
    "placed elegantly on an Italian Carrara marble countertop, soft golden hour ray lighting entering through an arched window, luxury minimalist aesthetic, 8k commercial product photography, depth of field",
  SCANDINAVIAN_MINIMAL:
    "set upon a clean light oak wooden surface next to a ceramic vase and dried eucalyptus, soft diffused Nordic daylight, clean neutral tones, high-end catalog aesthetic",
  URBAN_STREET:
    "photographed in an authentic urban cityscape setting on raw textured asphalt and weathered concrete, cinematic ambient city lighting, moody modern streetwear vibe",
  TROPICAL_OUTDOOR:
    "displayed outdoors on sun-drenched volcanic stone surrounded by lush monstera and palm foliage, crystal clear summer sunlight, vibrant natural colors",
  CYBERPUNK_NEON:
    "set on reflective dark obsidian glass with vibrant magenta and cyan neon rim lighting, subtle volumetric mist, futuristic high-tech aesthetic",
  STUDIO_PODIUM:
    "centered on a geometric matte travertine pedestal with soft dual-tone studio strobe lighting, subtle gradient background, award-winning advertising visual",
};

export async function generateProductLifestyleScene(
  params: LifestyleGenerationParams,
): Promise<LifestyleGenerationResult> {
  const backdrop = PRESET_BACKDROPS[params.preset] || PRESET_BACKDROPS.STUDIO_PODIUM;
  const customDetail = params.customPrompt ? ` Extra context: ${params.customPrompt}.` : "";
  const categoryContext = params.category ? ` Category: ${params.category}.` : "";

  const prompt = `Professional commercial advertising photograph of ${params.productTitle}.${categoryContext} The product is ${backdrop}.${customDetail} Crisp focus, flawless reflections, photorealistic 8k detail.`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      preset: params.preset,
      promptUsed: prompt,
      imageUrl: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1024&q=80&fit=crop`,
      source: "MOCK_FALLBACK",
    };
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: params.resolution || "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data?.[0]?.url || "";
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    return {
      preset: params.preset,
      promptUsed: prompt,
      imageUrl,
      revisedPrompt,
      source: "DALLE3",
    };
  } catch (error) {
    console.warn("DALL-E 3 image generation fallback triggered:", error);
    return {
      preset: params.preset,
      promptUsed: prompt,
      imageUrl: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1024&q=80&fit=crop`,
      source: "MOCK_FALLBACK",
    };
  }
}
