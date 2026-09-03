import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ILoyaltyTransaction extends Document {
  userId: string | mongoose.Types.ObjectId;
  type: "earn" | "redeem" | "adjustment";
  points: number; // positive for earn, negative for redeem
  orderId?: string | mongoose.Types.ObjectId; // For earn/redeem linked to order
  terminalId?: string; // If done at POS
  syncStatus: "synced" | "pending" | "conflict";
  offlineTransactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["earn", "redeem", "adjustment"], required: true },
    points: { type: Number, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    terminalId: { type: String },
    syncStatus: {
      type: String,
      enum: ["synced", "pending", "conflict"],
      default: "synced",
    },
    offlineTransactionId: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

LoyaltyTransactionSchema.index({ userId: 1, createdAt: -1 });
LoyaltyTransactionSchema.index({ offlineTransactionId: 1 }, { sparse: true });

export const LoyaltyTransaction = (mongoose.models.LoyaltyTransaction ||
  mongoose.model<ILoyaltyTransaction>(
    "LoyaltyTransaction",
    LoyaltyTransactionSchema
  )) as Model<ILoyaltyTransaction>;
