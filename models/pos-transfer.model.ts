import { mongoose } from "@/lib/db";

const { Schema, models, model } = mongoose;

export interface IPosTransferItem {
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  barcode?: string;
  quantityExpected: number;
  quantityReceived?: number;
  discrepancy?: number;
}

export interface IPosTransfer {
  _id?: string;
  transferNumber: string;
  sourceBranchId?: string;
  sourceBranchName: string;
  targetBranchId?: string;
  targetBranchName: string;
  items: IPosTransferItem[];
  status: "draft" | "in_transit" | "received" | "discrepancy" | "cancelled";
  dispatchedBy?: {
    cashierId?: string;
    cashierName?: string;
    date: Date;
  };
  receivedBy?: {
    cashierId?: string;
    cashierName?: string;
    date?: Date;
    notes?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PosTransferItemSchema = new Schema<IPosTransferItem>(
  {
    productId: { type: String, required: true },
    variantId: { type: String },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    barcode: { type: String },
    quantityExpected: { type: Number, required: true, min: 1 },
    quantityReceived: { type: Number, default: 0, min: 0 },
    discrepancy: { type: Number, default: 0 },
  },
  { _id: false },
);

const PosTransferSchema = new Schema<IPosTransfer>(
  {
    transferNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    sourceBranchId: { type: String },
    sourceBranchName: { type: String, required: true },
    targetBranchId: { type: String },
    targetBranchName: { type: String, required: true },
    items: { type: [PosTransferItemSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "in_transit", "received", "discrepancy", "cancelled"],
      default: "in_transit",
      index: true,
    },
    dispatchedBy: {
      cashierId: String,
      cashierName: String,
      date: { type: Date, default: Date.now },
    },
    receivedBy: {
      cashierId: String,
      cashierName: String,
      date: Date,
      notes: String,
    },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

export const PosTransfer =
  models.PosTransfer || model<IPosTransfer>("PosTransfer", PosTransferSchema);
