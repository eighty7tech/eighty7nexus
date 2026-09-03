/**
 * Executive Financial Digest Scheduler
 * Generates automated executive sales & margin digests and distributes
 * them via transactional email to store administrators.
 */

import { connectDB } from "@/lib/db";
import { generateExecutiveReport } from "@/lib/finance/executive-reports";
import { sendEmail } from "@/lib/email";
import { getSettings } from "@/models/settings.model";
import { formatCurrency } from "@/lib/money";
import { DEFAULT_CURRENCY } from "@/config/branding.config";

export interface DigestDeliveryResult {
  success: boolean;
  recipientsCount: number;
  reportSummary: {
    gmv: number;
    netRevenue: number;
    ordersCount: number;
    refunds: number;
    periodDays: number;
  };
  error?: string;
}

export async function sendExecutiveFinancialDigest(periodDays = 7): Promise<DigestDeliveryResult> {
  await connectDB();

  const settings = await getSettings();
  const recipientEmail =
    settings?.email?.fromEmail ||
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_FROM;

  if (!recipientEmail) {
    return {
      success: false,
      recipientsCount: 0,
      reportSummary: { gmv: 0, netRevenue: 0, ordersCount: 0, refunds: 0, periodDays },
      error: "No executive notification recipient email configured.",
    };
  }

  const report = await generateExecutiveReport(periodDays);
  const currency = DEFAULT_CURRENCY || "USD";
  const storeName = settings?.general?.storeName || "Eighty7Nexus";

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #0f172a, #1e293b); color: #ffffff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
    .header p { margin: 6px 0 0 0; color: #94a3b8; font-size: 14px; }
    .content { padding: 24px; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .metric-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .metric-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .metric-value { font-size: 22px; font-weight: 800; color: #0f172a; }
    .metric-value.highlight { color: #f59e0b; }
    .metric-value.green { color: #10b981; }
    .category-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    .category-table th { text-align: left; padding: 8px; border-bottom: 2px solid #e2e8f0; color: #64748b; }
    .category-table td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${storeName} Executive Digest</h1>
      <p>Financial Performance for the past ${periodDays} Days</p>
    </div>
    <div class="content">
      <div class="metric-grid">
        <div class="metric-box">
          <div class="metric-label">Gross Sales (GMV)</div>
          <div class="metric-value highlight">${formatCurrency(report.grossMerchandiseValue, currency)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Net Revenue</div>
          <div class="metric-value green">${formatCurrency(report.netRevenue, currency)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Completed Orders</div>
          <div class="metric-value">${report.totalOrders}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Average Order Value</div>
          <div class="metric-value">${formatCurrency(report.averageOrderValue, currency)}</div>
        </div>
      </div>

      <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
          <span style="color: #64748b;">Platform Commissions Earned:</span>
          <span style="font-weight: 700; color: #0f172a;">${formatCurrency(report.platformCommissions, currency)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
          <span style="color: #64748b;">Refunds Processed:</span>
          <span style="font-weight: 700; color: #ef4444;">${formatCurrency(report.totalRefunds, currency)} (${report.refundRatePercent}%)</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span style="color: #64748b;">Shipping Collected:</span>
          <span style="font-weight: 700; color: #0f172a;">${formatCurrency(report.shippingRevenue, currency)}</span>
        </div>
      </div>

      ${
        report.topPerformingCategories.length > 0
          ? `
        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 16px 0 8px 0;">Top Selling Categories</h3>
        <table class="category-table">
          <thead>
            <tr>
              <th>Category</th>
              <th style="text-align: right;">Orders</th>
              <th style="text-align: right;">Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${report.topPerformingCategories
              .map(
                (c) => `
              <tr>
                <td style="font-weight: 600;">${c.category}</td>
                <td style="text-align: right;">${c.orderCount}</td>
                <td style="text-align: right; font-weight: 700;">${formatCurrency(c.revenue, currency)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
          : ""
      }
    </div>
    <div class="footer">
      Generated automatically by Eighty7Nexus Financial Intelligence Engine · ${new Date().toLocaleDateString()}
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail({
    to: recipientEmail,
    subject: `📊 [${storeName}] ${periodDays}-Day Executive Financial Digest`,
    html: emailHtml,
  });

  return {
    success: true,
    recipientsCount: 1,
    reportSummary: {
      gmv: report.grossMerchandiseValue,
      netRevenue: report.netRevenue,
      ordersCount: report.totalOrders,
      refunds: report.totalRefunds,
      periodDays,
    },
  };
}
