import { NextRequest, NextResponse } from "next/server";
import { GhanaAddressSchema } from "@/lib/validations";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { country, address } = body;

    if (!address) {
      return NextResponse.json(
        { success: false, message: "Address is required" },
        { status: 400 }
      );
    }

    if (country === "Ghana") {
      const result = GhanaAddressSchema.safeParse(address);
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            message: "Validation failed",
            errors: result.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }
    } else {
      // Basic validation for international addresses (just ensure fields exist for now)
      const internationalSchema = z.object({
        fullName: z.string().min(2, "Name is required"),
        street: z.string().min(5, "Street address is required"),
        city: z.string().min(2, "City is required"),
        country: z.string().min(2, "Country is required"),
        postalCode: z.string().min(3, "Postal code is required"),
      });
      
      const result = internationalSchema.safeParse(address);
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            message: "Validation failed",
            errors: result.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: true, message: "Address is valid" });
  } catch (error) {
    console.error("Error validating address:", error);
    return NextResponse.json(
      { success: false, message: "Failed to validate address" },
      { status: 500 }
    );
  }
}
