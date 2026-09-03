import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reconcileDatabaseIndexes } from "@/lib/db/reconcile-indexes";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await reconcileDatabaseIndexes();
    return NextResponse.json({ success: true, report });
  } catch (error: unknown) {
    console.error("Index reconciliation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reconcile indexes" },
      { status: 500 },
    );
  }
}
