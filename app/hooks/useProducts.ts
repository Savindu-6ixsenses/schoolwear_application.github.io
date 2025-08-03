import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import { fetchProducts } from "@/lib/products/fetchProducts";
import { StoreProduct } from "@/types/products";

type ProductsResponse = {
  products: StoreProduct[];
  totalPages: number;
};

export function useProducts(q: {
  store_code: string;
  designId: string | null;
  page: number;
  pageSize: number;
  q: string | null;
  categories: string[];
}): UseQueryResult<ProductsResponse, Error> {
  const enabled = !!q.store_code && !!q.designId && q.designId !== "0";

  return useQuery<ProductsResponse, Error, ProductsResponse, (string | number | null)[]>({
    queryKey: [
      "products",
      q.store_code,
      q.designId,
      q.page,
      q.pageSize,
      q.q,
      q.categories.slice().sort().join(","),
    ],
    queryFn: () =>
      fetchProducts({
        store_code: q.store_code,
        designId: q.designId!,
        currentPage: q.page,
        currentPageSize: q.pageSize,
        query: q.q,
        categories: q.categories,
      }),
    enabled,
    placeholderData: keepPreviousData, // ✅ NEW in v5+
    staleTime: 30_000,
  });
}
