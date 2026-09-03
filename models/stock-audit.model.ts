import { mongoose } from "@/lib/db";

const { Schema, models, model } = mongoose;

export type StockAuditStatus = "draft" | "in_progress" | "completed" | "cancelled";

export interface IStockAuditItem {
  productId: mongoose.Types.ObjectId;
  variantId?: string;
  name: string;
  sku: string;
  barcode?: string;
  expectedQty: number;
  countedQty: number;
  variance: number;
  unitPrice: number;
  costPrice?: number;
  countedAt?: Date;
}

export interface IStockAudit {
  _id?: string;
  auditNumber: string;
  name: string;
  status: StockAuditStatus;
  locationId?: string;
  locationName?: string;
  vendorId?: mongoose.Types.ObjectId;
  items: IStockAuditItem[];
  totalExpectedQty: number;
  totalCountedQty: number;
  totalVarianceQty: number;
  totalVarianceValue: number;
  notes?: string;
  countedBy?: {
    userId?: string;
    name?: string;
    email?: string;
  };
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const StockAuditItemSchema = new Schema<IStockAuditItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: String },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    barcode: { type: String },
    expectedQty: { type: Number, required: true, default: 0 },
    countedQty: { type: Number, required: true, default: 0 },
    variance: { type: Number, required: true, default: 0 },
    unitPrice: { type: Number, required: true, default: 0 },
    costPrice: { type: Number },
    countedAt: { type: Date },
  },
  { _id: false },
);

const StockAuditSchema = new Schema<IStockAudit>(
  {
    auditNumber: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "in_progress", "completed", "cancelled"],
      default: "draft",
      index: true,
    },
    locationId: { type: String, index: true },
    locationName: { type: String },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", index: true },
    items: [StockAuditItemSchema],
    totalExpectedQty: { type: Number, default: 0 },
    totalCountedQty: { type: Number, default: 0 },
    totalVarianceQty: { type: Number, default: 0 },
    totalVarianceValue: { type: Number, default: 0 },
    notes: { type: String },
    countedBy: {
      userId: { type: String },
      name: { type: String },
      email: { type: String },
    },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

export const StockAudit =
  models.StockAudit || model<IStockAudit>("StockAudit", StockAuditSchema);
