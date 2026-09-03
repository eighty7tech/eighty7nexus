import { NextRequest, NextResponse } from "next/server";
import { sendExecutiveFinancialDigest } from "@/lib/finance/executive-digest-scheduler";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodDays = parseInt(searchParams.get("periodDays") || "7", 10);

    const result = await sendExecutiveFinancialDigest(periodDays);
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    console.error("Cron finance digest error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute finance digest cron" },
      { status: 500 },
    );
  }
}
