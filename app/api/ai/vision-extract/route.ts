import { NextRequest, NextResponse } from "next/server";
import { extractProductFromImage } from "@/lib/ai/vision-product-extractor";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { imageUrl, imageBase64, mimeType, brandContext, categoryHint } = body;

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: "Either imageUrl or imageBase64 is required" },
        { status: 400 },
      );
    }

    const result = await extractProductFromImage({
      imageUrl,
      imageBase64,
      mimeType,
      brandContext,
      categoryHint,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error("AI vision extraction route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract product metadata" },
      { status: 500 },
    );
  }
}
