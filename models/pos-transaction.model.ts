import mongoose, { Document, Schema } from "mongoose";

export interface IPOSTransaction extends Document {
  idempotencyKey: string;
  shiftId?: string;
  terminalId?: string;
  cashierId?: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    variantId?: mongoose.Types.ObjectId;
    name: string;
    sku: string;
    barcode?: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }>;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  tenderType: string;
  status: "completed" | "refunded" | "voided";
  offlineCreated: boolean;
  syncedAt: Date;
  createdAt: Date;
}

const POSTransactionSchema = new Schema<IPOSTransaction>({
  idempotencyKey: { type: String, required: true, unique: true },
  shiftId: { type: String },
  terminalId: { type: String },
  cashierId: { type: String },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId },
    name: { type: String, required: true },
    sku: { type: String },
    barcode: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  }],
  subtotal: { type: Number, required: true },
  taxTotal: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  tenderType: { type: String, required: true },
  status: { type: String, enum: ["completed", "refunded", "voided"], default: "completed" },
  offlineCreated: { type: Boolean, default: true },
  syncedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const POSTransaction = mongoose.models.POSTransaction || mongoose.model<IPOSTransaction>("POSTransaction", POSTransactionSchema);
