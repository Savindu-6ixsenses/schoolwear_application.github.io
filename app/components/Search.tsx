"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition} from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { ImSpinner } from "react-icons/im";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

const SearchComponent = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams?.get("q") || "";

  // ✅ Create a debounced search handler
  const handleSearch = debounce((newQuery: string) => {
    const newSearchParams = new URLSearchParams(searchParams?.toString());
    newSearchParams.set("q", newQuery);

    startTransition(() => {
      router.push(`?${newSearchParams.toString()}`);
      onSearch(newQuery);
    });
  }, 400); // ✅ Debounce interval (500ms)

  return (
    <form className="relative flex w-full flex-col gap-2 sm:w-fit" onSubmit={(e) => e.preventDefault()}>
      <label className="font-semibold uppercase" htmlFor="search">
        Search
      </label>
      <div className="flex relative rounded-md shadow-md border border-gray-300">
        <div className="m-auto ml-3 mr-1">
          <FaMagnifyingGlass />
        </div>
        <input
          id="search"
          defaultValue={currentQuery}
          className="rounded-md p-2 w-full sm:w-96"
          name="q"
          placeholder="Search SAGE Code"
          type="search"
          onChange={(e) => handleSearch(e.target.value)}
        />
        {isPending && (
          <div className="m-auto ml-1 mr-3">
            <ImSpinner className="animate-spin" />
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchComponent;
