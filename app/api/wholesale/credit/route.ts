import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getCreditAccountByUserId,
  settleCreditInvoice,
} from "@/lib/wholesale/credit-service";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await getCreditAccountByUserId(session.user.id);
    if (!account) {
      return NextResponse.json({
        hasAccount: false,
        creditLimit: 0,
        availableCredit: 0,
        usedCredit: 0,
        invoices: [],
      });
    }

    const availableCredit = Math.max(0, account.creditLimit - account.usedCredit);

    return NextResponse.json({
      hasAccount: true,
      companyName: account.companyName,
      creditLimit: account.creditLimit,
      usedCredit: account.usedCredit,
      availableCredit,
      currency: account.currency,
      terms: account.terms,
      status: account.status,
      invoices: account.invoices,
    });
  } catch (error: unknown) {
    console.error("Wholesale credit GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch credit account" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, invoiceNumber, paymentAmount } = body;

    if (action === "pay_invoice") {
      if (!invoiceNumber || typeof paymentAmount !== "number" || paymentAmount <= 0) {
        return NextResponse.json(
          { error: "Valid invoiceNumber and paymentAmount are required." },
          { status: 400 },
        );
      }

      const res = await settleCreditInvoice({
        userId: session.user.id,
        invoiceNumber,
        paymentAmount,
      });

      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, remainingDue: res.remainingDue });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Wholesale credit POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process credit request" },
      { status: 500 },
    );
  }
}
