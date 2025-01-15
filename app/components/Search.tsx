"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const SearchComponent = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams?.get("q") || "";

  return (
    <form className="relative flex w-full flex-col gap-2 sm:w-fit">
      <label className="font-semibold uppercase" htmlFor="search">
        Search
      </label>
      <input
        id="search"
        defaultValue={currentQuery}
        className="border border-gray-300 rounded-md p-2 w-full sm:w-96"
        name="q"
        placeholder="Search products..."
        type="search"
        onChange={(e) => {
          const newQuery = e.target.value;

          const newSearchParams = new URLSearchParams(searchParams?.toString());
          newSearchParams.set("q", newQuery);

          // Use startTransition to wrap the navigation update
          startTransition(() => {
            router.push(`?${newSearchParams.toString()}`);
            onSearch(newQuery);
          });
        }}
      />
      {isPending && <p className="text-sm text-gray-500">Searching...</p>}
    </form>
  );
};

export default SearchComponent;
