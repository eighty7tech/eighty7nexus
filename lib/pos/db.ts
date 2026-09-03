import Dexie, { type Table } from "dexie";

export interface POSProduct {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  variants?: Array<{
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
  }>;
}

export interface POSPendingTransaction {
  id: string; // idempotencyKey
  timestamp: Date;
  cart: any; // Simplified for now
  total: number;
  tenderType: string;
  synced: boolean;
}

export interface POSSetting {
  key: string;
  value: any;
}

export class POSDatabase extends Dexie {
  products!: Table<POSProduct, string>;
  transactions!: Table<POSPendingTransaction, string>;
  settings!: Table<POSSetting, string>;

  constructor() {
    super("POSDatabase");
    this.version(1).stores({
      products: "_id, sku, barcode, name, category",
      transactions: "id, timestamp, synced",
      settings: "key",
    });
  }
}

// We only instantiate the DB in the browser to avoid Next.js SSR errors
export const posDb = typeof window !== "undefined" ? new POSDatabase() : (null as unknown as POSDatabase);
