import type { IOrder } from "@/types";

export function generateOrderConfirmationEmail(order: Partial<IOrder>, storeName: string, storeUrl: string): string {
  const isPickup = !!order.fulfillment?.pickup;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - ${storeName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
    .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
    .content { padding: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    .details-box { background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Thank you for your order!</h2>
      <p>Order #${order.orderNumber}</p>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      <p>We've received your order and are getting it ready. We'll notify you when it's on the way!</p>
      
      <div class="details-box">
        <h3>Order Summary</h3>
        <p><strong>Total Amount:</strong> ₵${(order.total || 0).toFixed(2)}</p>
        
        ${isPickup ? `
          <h3>Pickup Location</h3>
          <p><strong>${order.fulfillment?.pickup?.pickupLocationName}</strong></p>
          <p>${order.fulfillment?.pickup?.pickupAddress}</p>
        ` : `
          <h3>Delivery Address</h3>
          <p>${order.shippingAddress?.street}</p>
          <p>${order.shippingAddress?.city}, ${order.shippingAddress?.state}</p>
        `}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${storeUrl}/track-order?order=${order.orderNumber}" class="button">Track Your Order</a>
      </div>
    </div>
    
    <div class="footer">
      <p>If you have any questions, reply to this email or contact us at support@${storeUrl.replace('https://', '')}.</p>
      <p>&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
