import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  evaluateOrderApprovalRequirement,
  createApprovalRequest,
  resolveApprovalRequest,
  listCompanyApprovalRequests,
} from "@/lib/wholesale/approval-workflow";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") || undefined;
    const tickets = listCompanyApprovalRequests(companyId);

    return NextResponse.json({ success: true, tickets });
  } catch (error: unknown) {
    console.error("Wholesale approvals GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch approvals" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "evaluate") {
      const { companyId, orderTotal } = body;
      const evaluation = await evaluateOrderApprovalRequirement({
        companyId,
        buyerUserId: session.user.id,
        orderTotal: parseFloat(orderTotal),
      });
      return NextResponse.json({ success: true, evaluation });
    }

    if (action === "submit") {
      const { orderId, companyId, orderTotal, requiredRole, status } = body;
      const ticket = await createApprovalRequest({
        orderId,
        companyId,
        buyerUserId: session.user.id,
        buyerName: session.user.name || "Corporate Buyer",
        orderTotal: parseFloat(orderTotal),
        requiredRole,
        status,
      });
      return NextResponse.json({ success: true, ticket });
    }

    if (action === "decide") {
      const { approvalId, decision, notes } = body;
      const ticket = resolveApprovalRequest({
        approvalId,
        approverUserId: session.user.id,
        approverName: session.user.name || "Approver",
        decision,
        notes,
      });
      return NextResponse.json({ success: true, ticket });
    }

    return NextResponse.json({ error: "Invalid action. Expected evaluate, submit, or decide." }, { status: 400 });
  } catch (error: unknown) {
    console.error("Wholesale approvals POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process approval action" },
      { status: 500 },
    );
  }
}
