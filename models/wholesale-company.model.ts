/**
 * B2B Wholesale Company Organization & Hierarchy Model
 * Defines corporate accounts, staff role hierarchies, custom price tiers,
 * and multi-stage purchase approval limit rules.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export type WholesaleMemberRole = "BUYER" | "PURCHASING_MANAGER" | "FINANCE_DIRECTOR";

export interface IWholesaleMember {
  userId: string;
  name: string;
  email: string;
  role: WholesaleMemberRole;
  spendingLimit: number;
}

export interface IWholesaleCompany extends Document {
  name: string;
  taxId: string;
  registrationNumber?: string;
  billingAddress: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  tier: "TIER_1" | "TIER_2" | "ENTERPRISE";
  customDiscountPercent: number;
  approvalRules: {
    managerThreshold: number; // e.g. $5,000
    financeDirectorThreshold: number; // e.g. $25,000
  };
  members: IWholesaleMember[];
  status: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
  createdAt: Date;
  updatedAt: Date;
}

const WholesaleMemberSchema = new Schema<IWholesaleMember>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: {
      type: String,
      enum: ["BUYER", "PURCHASING_MANAGER", "FINANCE_DIRECTOR"],
      default: "BUYER",
    },
    spendingLimit: { type: Number, default: 5000 },
  },
  { _id: false },
);

const WholesaleCompanySchema = new Schema<IWholesaleCompany>(
  {
    name: { type: String, required: true, trim: true, index: true },
    taxId: { type: String, required: true, trim: true, index: true },
    registrationNumber: { type: String, trim: true },
    billingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      postalCode: { type: String, required: false },
      country: { type: String, required: true, default: "GH" },
    },
    tier: {
      type: String,
      enum: ["TIER_1", "TIER_2", "ENTERPRISE"],
      default: "TIER_1",
    },
    customDiscountPercent: { type: Number, default: 0, min: 0, max: 80 },
    approvalRules: {
      managerThreshold: { type: Number, default: 5000 },
      financeDirectorThreshold: { type: Number, default: 25000 },
    },
    members: [WholesaleMemberSchema],
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

export const WholesaleCompany: Model<IWholesaleCompany> =
  mongoose.models.WholesaleCompany ||
  mongoose.model<IWholesaleCompany>("WholesaleCompany", WholesaleCompanySchema);
