/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PricingRule } from "@/models";

export async function GET(req: Request) {
  try {
    // Mocked auth
    const session = { user: { role: "ADMIN" } };
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Support filtering by active status
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";
    
    const query = activeOnly ? { isActive: true } : {};
    
    const rules = await PricingRule.find(query).sort({ priority: -1, createdAt: -1 });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Pricing rules GET error:", error);
    return NextResponse.json({ error: "Failed to fetch pricing rules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    await dbConnect();
    
    const newRule = new PricingRule(body);
    await newRule.save();

    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error("Pricing rules POST error:", error);
    return NextResponse.json({ error: "Failed to create pricing rule" }, { status: 500 });
  }
}
