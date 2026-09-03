import mongoose, { Schema, Document } from "mongoose";

export enum ShiftStatus {
  OPEN = "open",
  CLOSED = "closed",
}

export interface IPOSShift extends Document {
  cashierId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  openedAt: Date;
  closedAt?: Date;
  status: ShiftStatus;
  
  // Starting amounts
  startingCash: number;
  
  // Expected amounts (calculated from transactions)
  expectedCash: number;
  expectedCard: number;
  
  // Declared amounts (counted by cashier)
  declaredCash?: number;
  declaredCard?: number;
  
  // Discrepancies (declared - expected)
  cashDiscrepancy?: number;
  cardDiscrepancy?: number;

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const POSShiftSchema = new Schema<IPOSShift>(
  {
    cashierId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryLocation",
      required: true,
    },
    openedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    closedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(ShiftStatus),
      default: ShiftStatus.OPEN,
      required: true,
    },
    startingCash: {
      type: Number,
      required: true,
      default: 0,
    },
    expectedCash: {
      type: Number,
      required: true,
      default: 0,
    },
    expectedCard: {
      type: Number,
      required: true,
      default: 0,
    },
    declaredCash: {
      type: Number,
    },
    declaredCard: {
      type: Number,
    },
    cashDiscrepancy: {
      type: Number,
    },
    cardDiscrepancy: {
      type: Number,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// Prevent multiple open shifts for the same cashier at the same location
POSShiftSchema.index({ cashierId: 1, locationId: 1, status: 1 });

export const POSShift = mongoose.models.POSShift || mongoose.model<IPOSShift>("POSShift", POSShiftSchema);
