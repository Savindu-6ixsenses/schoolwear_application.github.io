"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { ImSpinner } from "react-icons/im";

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
      <div className="flex relative rounded-md shadow-md border border-gray-300">
        <div className="m-auto ml-3 mr-1">
        <FaMagnifyingGlass/>
        </div>
        <input
          id="search"
          defaultValue={currentQuery}
          className=" rounded-md p-2 w-full sm:w-96"
          name="q"
          placeholder="Search SAGE Code "
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
        {isPending && <div className="m-auto ml-1 mr-3">
        <ImSpinner className="animate-spin"/>
        </div>}
      </div>
    </form>
  );
};

export default SearchComponent;
