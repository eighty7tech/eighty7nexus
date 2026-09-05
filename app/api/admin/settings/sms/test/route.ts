import { NextRequest, NextResponse } from "next/server";
import { testSmsConnection } from "@/lib/sms";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/config/app.config";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { phone, smsSettings } = await req.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ success: false, error: "Valid phone number is required" }, { status: 400 });
    }

    if (!smsSettings || !smsSettings.provider) {
      return NextResponse.json({ success: false, error: "SMS configuration is missing" }, { status: 400 });
    }

    const provider = smsSettings.provider;
    const testMessage = `Test SMS from ${process.env.NEXT_PUBLIC_APP_NAME || "your store"}! Your SMS gateway (${provider}) is working.`;

    await testSmsConnection(phone, testMessage, provider, smsSettings);

    return NextResponse.json({ success: true, message: "Test SMS sent successfully!" });
  } catch (error: any) {
    console.error("SMS test failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send test SMS" },
      { status: 500 }
    );
  }
}
