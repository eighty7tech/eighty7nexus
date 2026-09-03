import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyBopisPickup } from "@/lib/shipping/bopis-handover";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderIdOrNumber, enteredPin } = body;

    if (!orderIdOrNumber || !enteredPin) {
      return NextResponse.json(
        { error: "orderIdOrNumber and enteredPin are required." },
        { status: 400 },
      );
    }

    const res = await verifyBopisPickup({
      orderIdOrNumber,
      enteredPin,
      cashierUserId: session.user.id,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, order: res.order });
  } catch (error: unknown) {
    console.error("BOPIS verification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify pickup" },
      { status: 500 },
    );
  }
}
