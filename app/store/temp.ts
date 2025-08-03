// store/useStoreState.ts
import { StoreProductReport } from "@/types/products";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type StoreProduct = {
	productId: string;
	productName: string;
	sizeVariations?: string;
	category: string;
	designGuideline: string;
};

interface StoreState {
	store_code: string;
	designId: string;
	category_list: string[];
	added_products: Record<string, StoreProduct[]>;

	setStoreCode: (store_code: string) => void;
	setDesignId: (designId: string) => void;
	setCategoryList: (categories: string[]) => void;
	addProduct: (designId: string, product: StoreProduct) => void;
	removeProduct: (designId: string, productId: string) => void;
	resetStoreState: () => void;
	loadInitialCategoryList: (store_code: string) => Promise<void>;
	initializeProductsFromServer: (store_code: string) => Promise<void>;
}

export const useStoreState = create<StoreState>()(
	persist(
		(set, get) => ({
			store_code: "",
			designId: "0",
			category_list: [],
			added_products: {},

			setStoreCode: (newStoreCode) => {
				const current = get().store_code;

				if (current && current !== newStoreCode) {
					console.log(
						`[Zustand] Store code changed: ${current} → ${newStoreCode}. Resetting...`
					);
					get().resetStoreState();
				}

				set({ store_code: newStoreCode });
			},

			setDesignId: (designId) => set({ designId }),

			setCategoryList: (categories) => set({ category_list: categories }),

			addProduct: (designId, product) => {
				const currentProducts = get().added_products[designId] || [];
				const exists = currentProducts.some(
					(p) => p.productId === product.productId
				);

				if (!exists) {
					const updatedProducts = [...currentProducts, product];
					set({
						added_products: {
							...get().added_products,
							[designId]: updatedProducts,
						},
					});

					// Add category if not present
					const categories = get().category_list;
					if (!categories.includes(product.category)) {
						set({ category_list: [...categories, product.category] });
					}

					console.log(
						`[Zustand] Product added under design ${designId}:`,
						product
					);
				}
			},

			removeProduct: (designId, productId) => {
				const currentProducts = get().added_products[designId] || [];
				const updatedProducts = currentProducts.filter(
					(p) => p.productId !== productId
				);

				if (updatedProducts.length < currentProducts.length) {
					set({
						added_products: {
							...get().added_products,
							[designId]: updatedProducts,
						},
					});
					console.log(
						`[Zustand] Product removed from design ${designId}: ${productId}`
					);
				}
			},

			resetStoreState: () => {
				set({
					store_code: "",
					designId: "0",
					category_list: [],
					added_products: {},
				});
			},

			loadInitialCategoryList: async (store_code: string) => {
				try {
					const res = await fetch("/api/initial_fetch/get_store_categories", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ store_code }),
					});

					if (!res.ok) throw new Error("Failed to fetch categories");

					const data = await res.json();
					console.log("[Zustand] Categories loaded:", data.relatedCategories);
					set({ category_list: data.relatedCategories });
				} catch (err) {
					console.error("[Zustand] Error loading categories:", err);
				}
			},

			initializeProductsFromServer: async (store_code: string) => {
				try {
					const res = await fetch("/api/initial_fetch/get_added_products", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ store_code }),
					});

					if (!res.ok) {
						const errorText = await res.text();
						throw new Error(
							`Server responded with status ${res.status}: ${errorText}`
						);
					}

					const { designItems } = await res.json(); // Expecting { designItems: { designId1: [products], ... } }

					if (!designItems || typeof designItems !== "object") {
						throw new Error("Invalid format received for designItems");
					}

					set({ added_products: designItems });
					// Handle case where there are no products at initialization
					if (Object.keys(designItems).length === 0) {
						console.warn("[Zustand] No products found for the store");
						set({ category_list: [] }); // Reset categories if no products
						return;
					}

					// Collect unique categories from products
					const categorySet = new Set<string>();
					Object.values(designItems).forEach((value) => {
						if (Array.isArray(value)) {
							const productList = value as StoreProductReport[];
							productList.forEach((product: StoreProductReport) => {
								if (product?.category) {
									categorySet.add(product.category);
								}
							});
						}
					});

					set({ category_list: Array.from(categorySet) });

					console.log(
						"[Zustand] Products and categories initialized from server"
					);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} catch (error: any) {
					console.error(
						"[Zustand] Failed to initialize products from server:",
						error.message
					);
				}
			},
		}),
		{
			name: "store-state", // localStorage key
			onRehydrateStorage: () => {
				console.log("[Zustand] Hydration starting");
				return (state, error) => {
					if (error) {
						console.error("[Zustand] Hydration error", error);
					} else {
						console.log("[Zustand] Hydration complete", state);
					}
				};
			},
		}
	)
);
