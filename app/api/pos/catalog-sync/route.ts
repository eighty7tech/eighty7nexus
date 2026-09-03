import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";

export async function GET() {
  try {
    await connectDB();
    
    // In a real scenario, this might support pagination or delta syncs
    // For this implementation, we fetch all active products for the offline DB
    const products = await Product.find({ status: "active" })
      .select("_id title sku barcode price compareAtPrice inventory category media variants")
      .lean();

    const formattedProducts = products.map((p: any) => ({
      _id: p._id.toString(),
      name: p.title,
      sku: p.sku || "",
      barcode: p.barcode || "",
      price: p.price,
      stock: p.inventory || 0,
      category: p.category ? p.category.toString() : "uncategorized",
      image: p.media?.[0]?.url || "",
      variants: p.variants?.map((v: any) => ({
        id: v._id?.toString() || crypto.randomUUID(),
        sku: v.sku || "",
        name: v.title || p.title,
        price: v.price || p.price,
        stock: v.inventory || 0,
      })) || [],
    }));

    return NextResponse.json({ success: true, data: formattedProducts });
  } catch (error: any) {
    console.error("POS Catalog Sync Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sync catalog" },
      { status: 500 }
    );
  }
}
