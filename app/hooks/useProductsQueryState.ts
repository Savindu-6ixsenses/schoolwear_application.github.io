/* eslint-disable @typescript-eslint/no-unused-expressions */
import { ProductsQuery } from "@/types/products";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useProductsQueryState(defaults: Partial<ProductsQuery> = {}) {
  const router = useRouter();
  const sp = useSearchParams();

  /**
   * Normalizes URL params into the query shape expected by the product hooks so the
   * page can be deep-linked and refreshed without losing filter state.
   */
  const query: ProductsQuery = useMemo(() => ({
    store_code: defaults.store_code ?? "",
    designId: sp.get("designId"),
    page: Number(sp.get("page") ?? defaults.page ?? 1),
    pageSize: Number(sp.get("page_size") ?? defaults.pageSize ?? 20),
    q: sp.get("q") ?? "",
    categories: sp.getAll("category"),
  }), [sp, defaults.store_code, defaults.page, defaults.pageSize]);

  function setQuery(next: Partial<ProductsQuery>, { replace = true } = {}) {
    const params = new URLSearchParams(sp);

    if (next.designId !== undefined) {
      next.designId ? params.set("designId", next.designId) : params.delete("designId");
      // Switching designs invalidates the current result window, so pagination resets to the first page.
      params.set("page", "1");
    }

    if (next.page !== undefined) params.set("page", String(next.page));
    if (next.pageSize !== undefined) params.set("page_size", String(next.pageSize));
    if (next.q !== undefined) next.q ? params.set("q", next.q) : params.delete("q");

    if (next.categories !== undefined) {
      params.delete("category");
      next.categories.forEach((c) => params.append("category", c));
      // Category filters can shrink the result set, so keeping the old page risks landing on an empty page.
      params.set("page", "1");
    }

    const url = `?${params.toString()}`;
    replace ? router.replace(url) : router.push(url);
  }

  return { query, setQuery };
}
