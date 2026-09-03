/**
 * B2B Enterprise Order Approval Workflow Engine
 * Enforces corporate governance spending thresholds, manages pending approval requests,
 * and maintains audit records for enterprise purchase orders.
 */

import { connectDB } from "@/lib/db";
import { WholesaleCompany, type WholesaleMemberRole } from "@/models/wholesale-company.model";

export type ApprovalStatus = "AUTO_APPROVED" | "PENDING_MANAGER" | "PENDING_FINANCE_DIRECTOR" | "APPROVED" | "REJECTED";

export interface ApprovalRequirementResult {
  requiresApproval: boolean;
  requiredRole?: WholesaleMemberRole;
  status: ApprovalStatus;
  reason: string;
}

export interface PurchaseOrderApprovalRequest {
  id: string;
  companyId: string;
  companyName: string;
  buyerUserId: string;
  buyerName: string;
  orderTotal: number;
  currency: string;
  status: ApprovalStatus;
  requiredRole: WholesaleMemberRole;
  approverUserId?: string;
  approverName?: string;
  decisionNotes?: string;
  requestedAt: Date;
  decidedAt?: Date;
}

// In-memory approval queue (persisted or referenced across orders)
const approvalQueue = new Map<string, PurchaseOrderApprovalRequest>();

/**
 * Determines whether a purchase order exceeds buyer thresholds and requires corporate escalation.
 */
export async function evaluateOrderApprovalRequirement(params: {
  companyId: string;
  buyerUserId: string;
  orderTotal: number;
}): Promise<ApprovalRequirementResult> {
  await connectDB();

  const company = await WholesaleCompany.findById(params.companyId).lean();
  if (!company) {
    return {
      requiresApproval: false,
      status: "AUTO_APPROVED",
      reason: "No corporate company account constraints applied.",
    };
  }

  const member = company.members.find((m) => m.userId === params.buyerUserId);
  const userLimit = member?.spendingLimit ?? 5000;
  const managerThreshold = company.approvalRules?.managerThreshold ?? 5000;
  const directorThreshold = company.approvalRules?.financeDirectorThreshold ?? 25000;

  // 1. If user is Finance Director, immediate auto-approval
  if (member?.role === "FINANCE_DIRECTOR") {
    return {
      requiresApproval: false,
      status: "AUTO_APPROVED",
      reason: "Buyer has Finance Director authority.",
    };
  }

  // 2. If user is Purchasing Manager and amount < Director Threshold
  if (member?.role === "PURCHASING_MANAGER") {
    if (params.orderTotal <= directorThreshold) {
      return {
        requiresApproval: false,
        status: "AUTO_APPROVED",
        reason: "Within Purchasing Manager authorized ceiling.",
      };
    }
    return {
      requiresApproval: true,
      requiredRole: "FINANCE_DIRECTOR",
      status: "PENDING_FINANCE_DIRECTOR",
      reason: `Order total ($${params.orderTotal}) exceeds $${directorThreshold} requiring Finance Director approval.`,
    };
  }

  // 3. Regular Corporate Buyer
  if (params.orderTotal <= userLimit) {
    return {
      requiresApproval: false,
      status: "AUTO_APPROVED",
      reason: `Order total ($${params.orderTotal}) is within buyer spending limit ($${userLimit}).`,
    };
  }

  if (params.orderTotal > directorThreshold) {
    return {
      requiresApproval: true,
      requiredRole: "FINANCE_DIRECTOR",
      status: "PENDING_FINANCE_DIRECTOR",
      reason: `High-value order ($${params.orderTotal}) requires executive Finance Director sign-off.`,
    };
  }

  return {
    requiresApproval: true,
    requiredRole: "PURCHASING_MANAGER",
    status: "PENDING_MANAGER",
    reason: `Order total ($${params.orderTotal}) exceeds personal limit ($${userLimit}) requiring Purchasing Manager approval.`,
  };
}

/**
 * Creates and registers a pending approval ticket in the corporate queue.
 */
export async function createApprovalRequest(params: {
  orderId: string;
  companyId: string;
  buyerUserId: string;
  buyerName: string;
  orderTotal: number;
  currency?: string;
  requiredRole: WholesaleMemberRole;
  status: ApprovalStatus;
}): Promise<PurchaseOrderApprovalRequest> {
  await connectDB();
  const company = await WholesaleCompany.findById(params.companyId).lean();

  const ticket: PurchaseOrderApprovalRequest = {
    id: params.orderId,
    companyId: params.companyId,
    companyName: company?.name || "Corporate Buyer",
    buyerUserId: params.buyerUserId,
    buyerName: params.buyerName,
    orderTotal: params.orderTotal,
    currency: params.currency || "USD",
    status: params.status,
    requiredRole: params.requiredRole,
    requestedAt: new Date(),
  };

  approvalQueue.set(params.orderId, ticket);
  return ticket;
}

/**
 * Executes manager or finance director approval / rejection.
 */
export function resolveApprovalRequest(params: {
  approvalId: string;
  approverUserId: string;
  approverName: string;
  decision: "APPROVED" | "REJECTED";
  notes?: string;
}): PurchaseOrderApprovalRequest {
  const ticket = approvalQueue.get(params.approvalId);
  if (!ticket) {
    throw new Error(`Approval request #${params.approvalId} not found.`);
  }

  ticket.status = params.decision;
  ticket.approverUserId = params.approverUserId;
  ticket.approverName = params.approverName;
  ticket.decisionNotes = params.notes;
  ticket.decidedAt = new Date();

  approvalQueue.set(params.approvalId, ticket);
  return ticket;
}

/**
 * Lists all active approval tickets for a company.
 */
export function listCompanyApprovalRequests(companyId?: string): PurchaseOrderApprovalRequest[] {
  const all = Array.from(approvalQueue.values());
  if (!companyId) return all;
  return all.filter((t) => t.companyId === companyId);
}
