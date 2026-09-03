import { successResponse, errorResponse } from "@/lib/api/response";
import { withApi } from "@/lib/api/handler";
import { WholesaleQuote } from "@/models/wholesale-quote.model";
import { Order } from "@/models/order.model";

export const GET = withApi(
  { auth: "admin" },
  async () => {
    try {
      const quotes = await WholesaleQuote.find()
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .lean();
      
      return successResponse({ quotes }, "Wholesale quotes retrieved successfully");
    } catch (error: any) {
      console.error("Error fetching wholesale quotes:", error);
      return errorResponse("Failed to fetch wholesale quotes", 500);
    }
  }
);

export const PUT = withApi(
  { auth: "admin" },
  async ({ request }) => {
    try {
      const { id, action, quotedPrice, notesToCustomer } = await request.json();

      if (!id || !action) {
        return errorResponse("Missing required fields", 400);
      }

      const quote = await WholesaleQuote.findById(id);
      if (!quote) return errorResponse("Quote not found", 404);

      if (action === "send_quote") {
        quote.status = "quote_sent";
        if (notesToCustomer) quote.notesToCustomer = notesToCustomer;
        
        // Naive update for single item for simplicity, but could be array of prices
        if (quotedPrice && quote.items.length > 0) {
          quote.items[0].quotedPrice = quotedPrice;
          quote.items[0].lineTotal = quotedPrice * quote.items[0].requestedQuantity;
          quote.subtotal = quote.items[0].lineTotal;
          quote.total = quote.subtotal + quote.shippingQuoted + quote.taxQuoted;
        }
        await quote.save();
        return successResponse(null, "Quote sent successfully");
      } 
      else if (action === "accept") {
        quote.status = "accepted";
        
        // Auto-convert to Order
        const newOrder = new Order({
          orderNumber: `ORD-${Date.now()}`,
          customerId: quote.userId,
          items: quote.items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.productName,
            sku: item.sku,
            price: item.quotedPrice || item.targetPrice || 0,
            quantity: item.requestedQuantity,
            vendorId: quote.userId, // Stub: actual vendorId would be resolved
          })),
          subtotal: quote.subtotal,
          shippingCost: quote.shippingQuoted,
          tax: quote.taxQuoted,
          total: quote.total,
          paymentMethod: "net_terms",
          paymentStatus: "pending",
          shippingAddress: {
             street: "TBD", city: "TBD", state: "TBD", postalCode: "TBD", country: "TBD" 
          } // Stub address
        });
        
        await newOrder.save();
        quote.convertedOrderId = newOrder._id;
        quote.status = "converted_to_order";
        await quote.save();

        return successResponse(null, "Quote accepted and converted to order successfully");
      }
      else if (action === "reject") {
        quote.status = "rejected";
        await quote.save();
        return successResponse(null, "Quote rejected successfully");
      } 
      else {
        return errorResponse("Invalid action", 400);
      }
    } catch (error: any) {
      console.error("Error updating wholesale quote:", error);
      return errorResponse("Failed to update wholesale quote", 500);
    }
  }
);
