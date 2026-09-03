import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  exportDataWarehouseBatches,
  type WarehouseDialect,
} from "@/lib/analytics/data-warehouse-sync";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dialect = (searchParams.get("dialect") as WarehouseDialect) || "BIGQUERY";
    const limit = parseInt(searchParams.get("limit") || "1000", 10);

    const exportData = await exportDataWarehouseBatches(dialect, limit);
    return NextResponse.json({ success: true, ...exportData });
  } catch (error: unknown) {
    console.error("Warehouse sync export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export data warehouse batches" },
      { status: 500 },
    );
  }
}
