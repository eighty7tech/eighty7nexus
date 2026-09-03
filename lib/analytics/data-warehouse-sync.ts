/**
 * Enterprise Data Warehouse Connector Engine
 * Transforms MongoDB documents into normalized, schema-validated event streams
 * and JSONL datasets for Google BigQuery, Snowflake, and PostgreSQL warehouses.
 */

import { connectDB } from "@/lib/db";
import { Order } from "@/models/order.model";
import { Product } from "@/models/product.model";
import { User } from "@/models/user.model";
import { LedgerEntry } from "@/models/ledger-entry.model";

export type WarehouseDialect = "BIGQUERY" | "SNOWFLAKE" | "POSTGRESQL";

export interface DataWarehouseExportResult {
  dialect: WarehouseDialect;
  extractedAt: Date;
  summary: {
    factOrdersCount: number;
    factLedgerEntriesCount: number;
    dimProductsCount: number;
    dimCustomersCount: number;
  };
  schemas: Record<string, string>;
  dataBatches: {
    fact_orders_jsonl: string;
    fact_ledger_jsonl: string;
    dim_products_jsonl: string;
    dim_customers_jsonl: string;
  };
}

export async function exportDataWarehouseBatches(
  dialect: WarehouseDialect = "BIGQUERY",
  limit = 1000,
): Promise<DataWarehouseExportResult> {
  await connectDB();

  const [orders, ledgerEntries, products, users] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).limit(limit).lean(),
    LedgerEntry.find().sort({ createdAt: -1 }).limit(limit).lean(),
    Product.find().sort({ createdAt: -1 }).limit(limit).lean(),
    User.find().sort({ createdAt: -1 }).limit(limit).lean(),
  ]);

  // 1. Fact Orders Normalization
  const factOrders = orders.map((o) => ({
    order_id: String(o._id),
    order_number: o.orderNumber || String(o._id),
    user_id: o.user ? String(o.user) : "ANONYMOUS",
    status: o.status,
    payment_status: o.paymentStatus || "PENDING",
    subtotal: o.subtotal || 0,
    tax: o.tax || 0,
    shipping_fee: o.shippingCost || 0,
    total_amount: o.total || 0,
    currency: o.currency || "USD",
    item_count: Array.isArray(o.items) ? o.items.length : 0,
    created_at: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
  }));

  // 2. Fact Ledger Normalization
  const factLedger = ledgerEntries.map((l) => ({
    entry_id: String(l._id),
    account_book: l.book || "GENERAL",
    debit_account: l.debit || "CASH",
    credit_account: l.credit || "REVENUE",
    amount: l.amount || 0,
    currency: l.currency || "USD",
    source_kind: l.source?.kind || "ORDER",
    reference_id: l.source?.ref || (l.source?.id ? String(l.source.id) : null),
    created_at: l.date ? new Date(l.date).toISOString() : new Date().toISOString(),
  }));

  // 3. Dim Products Normalization
  const dimProducts = products.map((p) => ({
    product_id: String(p._id),
    sku: p.sku || "N/A",
    title: p.name || "Untitled",
    price: p.price || 0,
    cost_price: p.costPrice || 0,
    stock_quantity: p.stock || 0,
    is_active: p.isActive ?? true,
    created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
  }));

  // 4. Dim Customers Normalization
  const dimCustomers = users.map((u) => ({
    customer_id: String(u._id),
    email: u.email || "",
    name: u.name || "Customer",
    role: u.role || "user",
    created_at: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
  }));

  const schemas = generateWarehouseSchemas(dialect);

  return {
    dialect,
    extractedAt: new Date(),
    summary: {
      factOrdersCount: factOrders.length,
      factLedgerEntriesCount: factLedger.length,
      dimProductsCount: dimProducts.length,
      dimCustomersCount: dimCustomers.length,
    },
    schemas,
    dataBatches: {
      fact_orders_jsonl: factOrders.map((r) => JSON.stringify(r)).join("\n"),
      fact_ledger_jsonl: factLedger.map((r) => JSON.stringify(r)).join("\n"),
      dim_products_jsonl: dimProducts.map((r) => JSON.stringify(r)).join("\n"),
      dim_customers_jsonl: dimCustomers.map((r) => JSON.stringify(r)).join("\n"),
    },
  };
}

function generateWarehouseSchemas(dialect: WarehouseDialect): Record<string, string> {
  if (dialect === "SNOWFLAKE") {
    return {
      dw_fact_orders: `CREATE TABLE IF NOT EXISTS dw_fact_orders (order_id VARCHAR, order_number VARCHAR, user_id VARCHAR, status VARCHAR, payment_status VARCHAR, subtotal FLOAT, tax FLOAT, shipping_fee FLOAT, total_amount FLOAT, currency VARCHAR, item_count NUMBER, created_at TIMESTAMP_NTZ);`,
      dw_fact_ledger: `CREATE TABLE IF NOT EXISTS dw_fact_ledger (entry_id VARCHAR, account_book VARCHAR, debit_account VARCHAR, credit_account VARCHAR, amount FLOAT, currency VARCHAR, source_kind VARCHAR, reference_id VARCHAR, created_at TIMESTAMP_NTZ);`,
    };
  }

  if (dialect === "POSTGRESQL") {
    return {
      dw_fact_orders: `CREATE TABLE IF NOT EXISTS dw_fact_orders (order_id TEXT PRIMARY KEY, order_number TEXT, user_id TEXT, status TEXT, payment_status TEXT, subtotal NUMERIC, tax NUMERIC, shipping_fee NUMERIC, total_amount NUMERIC, currency VARCHAR(3), item_count INT, created_at TIMESTAMPTZ);`,
      dw_fact_ledger: `CREATE TABLE IF NOT EXISTS dw_fact_ledger (entry_id TEXT PRIMARY KEY, account_book TEXT, debit_account TEXT, credit_account TEXT, amount NUMERIC, currency VARCHAR(3), source_kind TEXT, reference_id TEXT, created_at TIMESTAMPTZ);`,
    };
  }

  // Google BigQuery Standard SQL
  const bqDataset = process.env.BIGQUERY_DATASET || "eighty7nexus_warehouse";
  return {
    dw_fact_orders: `CREATE TABLE IF NOT EXISTS ${bqDataset}.dw_fact_orders (order_id STRING, order_number STRING, user_id STRING, status STRING, payment_status STRING, subtotal FLOAT64, tax FLOAT64, shipping_fee FLOAT64, total_amount FLOAT64, currency STRING, item_count INT64, created_at TIMESTAMP);`,
    dw_fact_ledger: `CREATE TABLE IF NOT EXISTS ${bqDataset}.dw_fact_ledger (entry_id STRING, account_book STRING, debit_account STRING, credit_account STRING, amount FLOAT64, currency STRING, source_kind STRING, reference_id STRING, created_at TIMESTAMP);`,
  };
}
