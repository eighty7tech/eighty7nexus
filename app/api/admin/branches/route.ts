import { mongoose } from "@/lib/db";
import { InventoryLocation } from "@/models/inventory-location.model";
import { withApi } from "@/lib/api/handler";
import { successResponse, createdResponse } from "@/lib/api/response";

export const GET = withApi(
  {
    auth: "admin",
    rateLimit: { action: "admin:branches:list", preset: "lenient" },
  },
  async ({ session }) => {
    // Determine vendor scope if it's a vendor admin or platform admin
    // Note: Assuming 'admin' auth scope handles this or we just use session.user.id
    const branches = await InventoryLocation.find({}).sort({ createdAt: -1 });
    return successResponse(branches);
  }
);

export const POST = withApi(
  {
    auth: "admin",
    rateLimit: { action: "admin:branches:create", preset: "moderate" },
  },
  async ({ request }) => {
    const body = await request.json();
    const { name, address, contactEmail, contactPhone, slug, isActive } = body;

    if (!name) {
      return new Response("Name is required", { status: 400 });
    }

    const branch = await InventoryLocation.create({
      name,
      address,
      contactEmail,
      contactPhone,
      slug,
      isActive: isActive !== undefined ? isActive : true,
    });

    return createdResponse(branch);
  }
);
