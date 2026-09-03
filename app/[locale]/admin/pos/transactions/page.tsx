import { connectDB } from "@/lib/db";
import { POSTransaction } from "@/models";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminPOSTransactionsPage() {
  await connectDB();
  
  const transactions = await POSTransaction.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">POS Reconciliations</h2>
      </div>
      
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Tender Type</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No synced POS transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx: any) => (
                <TableRow key={tx._id.toString()}>
                  <TableCell className="font-mono text-xs">{tx.idempotencyKey}</TableCell>
                  <TableCell>{format(new Date(tx.syncedAt), "MMM d, yyyy h:mm a")}</TableCell>
                  <TableCell>{tx.tenderType}</TableCell>
                  <TableCell>{tx.items?.length || 0} items</TableCell>
                  <TableCell className="text-right font-medium">
                    ${(tx.grandTotal || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      {tx.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
