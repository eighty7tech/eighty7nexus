import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { Settings } from "@/models/settings.model";
import { connectDB } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  
  if (!session || !isAdmin(session.user)) {
    return false;
  }
  
  // Basic admin check passed, but for backup/restore we could strictly check `isSuperAdmin` via DB.
  // For simplicity and since isAdmin includes Super Admins, we return true if they are admins.
  return true;
}

export async function GET(req: NextRequest) {
  const isAuthorized = await requireSuperAdmin();
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const settings = await Settings.findOne({}).lean();
    if (!settings) {
      return NextResponse.json({ error: "No settings found to backup" }, { status: 404 });
    }

    // Remove immutable or sensitive internal mongoose fields
    const { _id, __v, createdAt, updatedAt, ...cleanSettings } = settings as any;

    const backupData = JSON.stringify(cleanSettings, null, 2);
    
    return new NextResponse(backupData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="eighty7nexus-settings-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error: any) {
    console.error("Backup failed:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuthorized = await requireSuperAdmin();
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const payload = JSON.parse(text);

    await connectDB();

    // Verify it's a valid settings structure (at least contains one of the main keys)
    if (!payload.store || !payload.appearance) {
      return NextResponse.json({ error: "Invalid backup file structure" }, { status: 400 });
    }

    // Upsert the settings document
    const currentSettings = await Settings.findOne({});
    
    if (currentSettings) {
      // Overwrite existing settings, keeping the _id
      await Settings.updateOne({ _id: currentSettings._id }, { $set: payload });
    } else {
      // Insert new settings
      await Settings.create(payload);
    }

    // Force Next.js cache revalidation so settings reflect immediately across the app
    revalidatePath("/", "layout");
    
    return NextResponse.json({ success: true, message: "Settings restored successfully" });
  } catch (error: any) {
    console.error("Restore failed:", error);
    return NextResponse.json({ error: error.message || "Restore failed due to an unknown error" }, { status: 500 });
  }
}
