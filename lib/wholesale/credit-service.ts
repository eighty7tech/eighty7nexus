/**
 * B2B Wholesale Trade Credit & Net Terms Engine
 * Orchestrates credit limit allocations, Net-15/30/60/90 invoice checkouts,
 * dunning escalations, and late interest calculations.
 */

import { connectDB } from "@/lib/db";
import {
  WholesaleCredit,
  type IWholesaleCredit,
  type NetPaymentTerms,
} from "@/models/wholesale-credit.model";
import mongoose from "mongoose";

export async function getCreditAccountByUserId(userId: string): Promise<IWholesaleCredit | null> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  return WholesaleCredit.findOne({ userId }).lean() as Promise<IWholesaleCredit | null>;
}

export async function setupCreditAccount(params: {
  userId: string;
  companyName: string;
  taxId?: string;
  creditLimit: number;
  currency?: string;
  terms?: NetPaymentTerms;
  approvedBy?: string;
}): Promise<IWholesaleCredit> {
  await connectDB();

  const account = await WholesaleCredit.findOneAndUpdate(
    { userId: params.userId },
    {
      $set: {
        companyName: params.companyName,
        taxId: params.taxId,
        creditLimit: params.creditLimit,
        currency: params.currency || "USD",
        terms: params.terms || "net_30",
        status: "approved",
        approvedBy: params.approvedBy,
        approvedAt: new Date(),
      },
      $push: {
        auditTrail: {
          action: "LIMIT_SET",
          amount: params.creditLimit,
          reason: "Initial enterprise credit limit approved",
          timestamp: new Date(),
        },
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  return account;
}

export function computeDueDate(terms: NetPaymentTerms, fromDate = new Date()): Date {
  const days =
    terms === "net_15" ? 15 : terms === "net_30" ? 30 : terms === "net_60" ? 60 : 90;
  const due = new Date(fromDate);
  due.setDate(due.getDate() + days);
  return due;
}

export async function chargeCreditAccount(params: {
  userId: string;
  orderId: string;
  orderNumber?: string;
  invoiceNumber: string;
  amount: number;
}): Promise<{ success: boolean; error?: string; remainingCredit?: number }> {
  await connectDB();

  const account = await WholesaleCredit.findOne({ userId: params.userId });
  if (!account) {
    return { success: false, error: "No wholesale credit account found." };
  }

  if (account.status !== "approved") {
    return { success: false, error: `Credit account is ${account.status}. Cannot process invoice.` };
  }

  const available = account.creditLimit - account.usedCredit;
  if (params.amount > available) {
    return {
      success: false,
      error: `Insufficient available credit limit. Required: ${params.amount}, Available: ${available}`,
    };
  }

  const dueDate = computeDueDate(account.terms);

  account.usedCredit += params.amount;
  account.invoices.push({
    invoiceNumber: params.invoiceNumber,
    orderId: new mongoose.Types.ObjectId(params.orderId),
    orderNumber: params.orderNumber,
    amount: params.amount,
    paidAmount: 0,
    dueDate,
    status: "unpaid",
    dunningLevel: 0,
    interestAccrued: 0,
    issuedAt: new Date(),
  });

  account.auditTrail.push({
    action: "CHARGE",
    amount: params.amount,
    reason: `Invoice ${params.invoiceNumber} for Order #${params.orderNumber || params.orderId}`,
    timestamp: new Date(),
  });

  await account.save();

  return {
    success: true,
    remainingCredit: account.creditLimit - account.usedCredit,
  };
}

export async function settleCreditInvoice(params: {
  userId: string;
  invoiceNumber: string;
  paymentAmount: number;
}): Promise<{ success: boolean; error?: string; remainingDue?: number }> {
  await connectDB();

  const account = await WholesaleCredit.findOne({ userId: params.userId });
  if (!account) {
    return { success: false, error: "Account not found." };
  }

  const invoice = account.invoices.find((inv) => inv.invoiceNumber === params.invoiceNumber);
  if (!invoice) {
    return { success: false, error: `Invoice ${params.invoiceNumber} not found.` };
  }

  const outstanding = invoice.amount + invoice.interestAccrued - invoice.paidAmount;
  const payApplied = Math.min(params.paymentAmount, outstanding);

  invoice.paidAmount += payApplied;
  account.usedCredit = Math.max(0, account.usedCredit - payApplied);

  if (invoice.paidAmount >= invoice.amount + invoice.interestAccrued) {
    invoice.status = "paid";
    invoice.paidDate = new Date();
  }

  account.auditTrail.push({
    action: "PAYMENT",
    amount: payApplied,
    reason: `Payment against invoice ${params.invoiceNumber}`,
    timestamp: new Date(),
  });

  await account.save();

  return {
    success: true,
    remainingDue: Math.max(0, outstanding - payApplied),
  };
}

/**
 * Scans for overdue Net-Terms invoices, updates dunning levels, and accrues daily late interest fees.
 */
export async function processOverdueDunning(): Promise<{
  processedCount: number;
  escalatedCount: number;
}> {
  await connectDB();

  const now = new Date();
  const accounts = await WholesaleCredit.find({
    status: { $in: ["approved", "suspended"] },
    "invoices.status": { $in: ["unpaid", "overdue"] },
  });

  let processedCount = 0;
  let escalatedCount = 0;

  for (const account of accounts) {
    let accountModified = false;
    let hasLevel3Overdue = false;

    for (const inv of account.invoices) {
      if (inv.status === "paid" || inv.status === "cancelled") continue;

      if (inv.dueDate < now) {
        processedCount += 1;
        const daysOverdue = Math.floor(
          (now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24),
        );

        inv.status = "overdue";

        // Accrue interest daily: (Principal * AnnualRate / 365)
        const dailyRate = (account.interestRateAnnualPercent || 8.0) / 100 / 365;
        const unpaidPrincipal = inv.amount - inv.paidAmount;
        if (unpaidPrincipal > 0) {
          inv.interestAccrued = Math.round((inv.interestAccrued + unpaidPrincipal * dailyRate) * 100) / 100;
        }

        // Determine Dunning Level
        if (daysOverdue >= 30 && inv.dunningLevel < 3) {
          inv.dunningLevel = 3; // Final Notice / Freeze Account
          hasLevel3Overdue = true;
          escalatedCount += 1;
        } else if (daysOverdue >= 15 && inv.dunningLevel < 2) {
          inv.dunningLevel = 2; // Urgent Reminder
          escalatedCount += 1;
        } else if (daysOverdue >= 1 && inv.dunningLevel < 1) {
          inv.dunningLevel = 1; // Friendly Notice
          escalatedCount += 1;
        }

        accountModified = true;
      }
    }

    if (hasLevel3Overdue && account.status !== "suspended") {
      account.status = "suspended";
      account.auditTrail.push({
        action: "STATUS_CHANGED",
        reason: "Account suspended due to 30+ days overdue invoice (Dunning Level 3).",
        timestamp: new Date(),
      });
      accountModified = true;
    }

    if (accountModified) {
      await account.save();
    }
  }

  return { processedCount, escalatedCount };
}
