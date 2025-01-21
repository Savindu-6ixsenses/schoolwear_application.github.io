import { useTransition, useOptimistic } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Category {
  id: string;
  name: string; 
}

const CategoryToggleGroup = ({ categories }: { categories: Category[] }) => {
  const [isPending, startTransition] = useTransition();
  const [optimisticCategories, setOptimisticCategories] = useOptimistic<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleToggle = (newCategories: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");

    newCategories.forEach((category) => {
      return params.append("category", category);
    });

    startTransition(() => {
      setOptimisticCategories(newCategories); // Update optimistically
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div data-pending={isPending ? "" : undefined}>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleToggle([...optimisticCategories, category.id])}
          className={`btn ${
            optimisticCategories.includes(category.id) ? "active" : ""
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryToggleGroup;
