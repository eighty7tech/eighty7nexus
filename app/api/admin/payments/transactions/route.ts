import { connectDB } from "@/lib/db";
import { PaymentTransaction } from "@/models";
import { paginatedResponse } from "@/lib/api/response";
import { withApi } from "@/lib/api/handler";
import { fetchPaymentTransactionList } from "@/lib/payment-transaction-list";

export const GET = withApi(
  {
    auth: "admin",
    rateLimit: { action: "admin:payments:transactions:list", preset: "lenient" },
  },
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
    const status = (searchParams.get("status") || "all").trim().toLowerCase();
    const type = (searchParams.get("type") || "all").trim().toLowerCase();
    const provider = (searchParams.get("provider") || "all").trim().toLowerCase();
    const search = (searchParams.get("search") || "").trim();
    const requestedSortBy = (searchParams.get("sortBy") || "createdAt").trim();
    const sortableFields = new Set(["createdAt", "grossAmount", "netAmount"]);
    const sortBy = sortableFields.has(requestedSortBy)
      ? requestedSortBy
      : "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const list = await fetchPaymentTransactionList({
      page,
      limit,
      search,
      status,
      type,
      provider,
      sortBy,
      sortOrder: searchParams.get("sortOrder") === "asc" ? "asc" : "desc",
    });

    return paginatedResponse(list.items, list.page, list.limit, list.total);
  },
);
