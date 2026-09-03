import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  generateProductLifestyleScene,
  type LifestyleScenePreset,
} from "@/lib/ai/lifestyle-studio";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productTitle, category, description, preset, customPrompt, resolution } = body;

    if (!productTitle || typeof productTitle !== "string") {
      return NextResponse.json(
        { error: "productTitle is required." },
        { status: 400 },
      );
    }

    const result = await generateProductLifestyleScene({
      productTitle,
      category,
      description,
      preset: (preset as LifestyleScenePreset) || "STUDIO_PODIUM",
      customPrompt,
      resolution,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error("Lifestyle studio generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate lifestyle scene" },
      { status: 500 },
    );
  }
}
