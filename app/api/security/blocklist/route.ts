import { NextResponse } from "next/server";
import { getSettings } from "@/models/settings.model";
import { connectDB } from "@/lib/db";

// Cache for 1 hour; middleware edge requests will hit this fast response.
export const revalidate = 3600;

export async function GET() {
  try {
    await connectDB();
    const settings = await getSettings();
    const blockedCountries = settings.general.blockedCountries || [];
    
    return NextResponse.json({
      blockedCountries,
    });
  } catch (error) {
    console.error("Failed to fetch blocklist:", error);
    return NextResponse.json(
      { blockedCountries: [] },
      { status: 500 },
    );
  }
}
