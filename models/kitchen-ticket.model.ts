import { mongoose } from "@/lib/db";

const { Schema, models, model } = mongoose;

export type KdsTicketStatus =
  | "queued"
  | "in_progress"
  | "ready"
  | "completed"
  | "cancelled";

export type KdsTicketStation =
  | "kitchen"
  | "bar"
  | "bakery"
  | "assembly"
  | "packing"
  | "all";

export interface IKitchenTicketItem {
  name: string;
  quantity: number;
  sku?: string;
  variantName?: string;
  notes?: string;
  isReady?: boolean;
}

export interface IKitchenTicket {
  _id?: string;
  ticketNumber: number;
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  channel: "pos" | "storefront" | "bopis" | "delivery";
  status: KdsTicketStatus;
  station: KdsTicketStation;
  customerName?: string;
  tableNumber?: string;
  pagerNumber?: string;
  pickupCode?: string;
  locationId?: string;
  items: IKitchenTicketItem[];
  notes?: string;
  startedAt?: Date;
  readyAt?: Date;
  completedAt?: Date;
  slaMinutes: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const KitchenTicketItemSchema = new Schema<IKitchenTicketItem>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    sku: { type: String },
    variantName: { type: String },
    notes: { type: String },
    isReady: { type: Boolean, default: false },
  },
  { _id: false },
);

const KitchenTicketSchema = new Schema<IKitchenTicket>(
  {
    ticketNumber: { type: Number, required: true, index: true },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: { type: String, required: true, index: true },
    channel: {
      type: String,
      enum: ["pos", "storefront", "bopis", "delivery"],
      default: "pos",
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "in_progress", "ready", "completed", "cancelled"],
      default: "queued",
      index: true,
    },
    station: {
      type: String,
      enum: ["kitchen", "bar", "bakery", "assembly", "packing", "all"],
      default: "kitchen",
      index: true,
    },
    customerName: { type: String },
    tableNumber: { type: String },
    pagerNumber: { type: String },
    pickupCode: { type: String },
    locationId: { type: String, index: true },
    items: [KitchenTicketItemSchema],
    notes: { type: String },
    startedAt: { type: Date },
    readyAt: { type: Date },
    completedAt: { type: Date },
    slaMinutes: { type: Number, default: 15 },
  },
  { timestamps: true },
);

KitchenTicketSchema.index({ status: 1, locationId: 1, createdAt: -1 });

export const KitchenTicket =
  models.KitchenTicket || model<IKitchenTicket>("KitchenTicket", KitchenTicketSchema);
