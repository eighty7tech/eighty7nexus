import { Wishlist, Product, CustomerProfile } from "@/models";
import { successResponse } from "@/lib/api/response";
import { NextResponse } from "next/server";
import { ValidationError } from "@/lib/api/errors";
import { withApi } from "@/lib/api/handler";
import {
  isStorefrontMultiVendorEnabled,
  isStorefrontProductSourceAllowed,
} from "@/lib/product-visibility";

/**
 * GET /api/wishlist
 * Get user's wishlist
 */
export const GET = withApi({ auth: "user" }, async ({ session }) => {
  const isMultiVendorEnabled = await isStorefrontMultiVendorEnabled();

  const wishlist = await Wishlist.findOne({ userId: session.user.id })
    .populate({
      path: "items.productId",
      select:
        "name slug price comparePrice images stock status featured rating reviewCount options variants createdAt productSource",
      populate: {
        path: "vendorId",
        select: "storeName slug",
      },
    })
    .lean();

  if (!wishlist) {
    return successResponse({ items: [] });
  }

  // Filter out any items where product was deleted
  const validItems = (wishlist.items || []).filter(
    (item: any) =>
      item.productId !== null &&
      item.productId.status === "active" &&
      isStorefrontProductSourceAllowed(
        item.productId.productSource,
        isMultiVendorEnabled,
      ),
  );

  return successResponse({
    items: validItems.map((item: any) => ({
      productId: item.productId._id,
      product: item.productId,
      addedAt: item.addedAt,
    })),
  });
});

/**
 * POST /api/wishlist
 * Add item to wishlist
 */
export const POST = withApi({ auth: "user" }, async ({ request, session }) => {
  const isMultiVendorEnabled = await isStorefrontMultiVendorEnabled();

  const body = await request.json();
  const { productId } = body;

  if (!productId) {
    throw new ValidationError({ productId: ["Product ID is required"] });
  }

  // Verify product exists
  const product = await Product.findById(productId)
    .select("status productSource")
    .lean();
  if (!product) {
    throw new ValidationError({ productId: ["Product not found"] });
  }
  if (
    product.status !== "active" ||
    !isStorefrontProductSourceAllowed(
      (product as { productSource?: unknown }).productSource,
      isMultiVendorEnabled,
    )
  ) {
    throw new ValidationError({
      productId: ["Product is not available"],
    });
  }

  // Get or create wishlist. `userId` is unique at the DB level, so a
  // concurrent first-add races into a duplicate-key error — retry once
  // against the winner's document instead of failing the request.
  let wishlist = await Wishlist.findOne({ userId: session.user.id });

  if (!wishlist) {
    wishlist = new Wishlist({
      userId: session.user.id,
      items: [],
    });
  }

  // Check if already in wishlist
  const existingIndex = wishlist.items.findIndex(
    (item) => item.productId.toString() === productId,
  );

  if (existingIndex === -1) {
    wishlist.items.push({
      productId,
      addedAt: new Date(),
    });
    try {
      await wishlist.save();
    } catch (err) {
      const isDuplicate =
        typeof err === "object" &&
        err !== null &&
        (err as { code?: number }).code === 11000;
      if (!isDuplicate) throw err;
      // Guard by items.productId, not $addToSet of the whole subdocument —
      // the winner's entry has a different addedAt, so $addToSet would treat
      // it as distinct and insert a duplicate row for the same product.
      await Wishlist.updateOne(
        { userId: session.user.id, "items.productId": { $ne: productId } },
        { $push: { items: { productId, addedAt: new Date() } } },
      );
      wishlist = await Wishlist.findOne({ userId: session.user.id });
      if (!wishlist) throw err;
    }

    // Update wishlist count in customer profile (fire-and-forget)
    CustomerProfile.updateOne(
      { userId: session.user.id },
      { $set: { "stats.totalWishlistItems": wishlist.items.length } },
    ).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    message: "Added to wishlist",
    data: { itemCount: wishlist.items.length },
  });
});

/**
 * DELETE /api/wishlist
 * Remove item from wishlist
 */
// Shopper-owned data: removing a wishlist entry stays available on demo.
export const DELETE = withApi({ auth: "user", demo: "allow" }, async ({ request, session }) => {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    throw new ValidationError({ productId: ["Product ID is required"] });
  }

  const wishlist = await Wishlist.findOne({ userId: session.user.id });

  if (wishlist) {
    wishlist.items = wishlist.items.filter(
      (item) => item.productId.toString() !== productId,
    );
    await wishlist.save();

    // Update wishlist count in customer profile (fire-and-forget)
    CustomerProfile.updateOne(
      { userId: session.user.id },
      { $set: { "stats.totalWishlistItems": wishlist.items.length } },
    ).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    message: "Removed from wishlist",
    data: { itemCount: wishlist?.items.length || 0 },
  });
});
