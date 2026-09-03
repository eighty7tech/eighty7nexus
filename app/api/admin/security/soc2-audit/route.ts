import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runSOC2ComplianceAudit } from "@/lib/security/soc2-auditor";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await runSOC2ComplianceAudit();
    return NextResponse.json({ success: true, report });
  } catch (error: unknown) {
    console.error("SOC 2 audit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate SOC 2 audit" },
      { status: 500 },
    );
  }
}
