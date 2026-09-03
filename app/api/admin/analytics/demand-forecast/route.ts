import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateDemandForecast } from "@/lib/analytics/demand-forecasting";
import { generateExecutiveReport } from "@/lib/finance/executive-reports";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "forecast" or "executive"
    const vendorId = searchParams.get("vendorId") || undefined;
    const periodDays = parseInt(searchParams.get("periodDays") || "30", 10);

    if (type === "executive") {
      const execReport = await generateExecutiveReport(periodDays);
      return NextResponse.json({ success: true, report: execReport });
    }

    const forecast = await calculateDemandForecast({
      vendorId,
      targetSafetyDays: 30,
      supplierLeadTimeDays: 7,
      limit: 50,
    });

    return NextResponse.json({ success: true, forecast });
  } catch (error: unknown) {
    console.error("Demand forecast analytics error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate analytics forecast" },
      { status: 500 },
    );
  }
}
