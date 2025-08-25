// store/useStoreState.ts
import { fetchStore } from "@/services/stores";
import { DesignView } from "@/types/designs";
import { StoreProductReport } from "@/types/products";
import { StoreCreationProps } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StoreState {
	store: StoreCreationProps;
	designList: DesignView[];
	category_list: string[];
	added_products: Record<string, StoreProductReport[]>;
	isInitialized: boolean;

	setInitialized: (flag: boolean) => void;
	setStore: (store_code: string) => void;
	setDesignList: (designList: DesignView[]) => void;
	setCategoryList: (categories: string[]) => void;
	addProduct: (designId: string, product: StoreProductReport) => void;
	removeProduct: (designId: string, productId: string) => void;
	resetStoreState: () => void;
	loadInitialCategoryList: (store_code: string) => Promise<void>;
	initializeProductsFromServer: (store_code: string) => Promise<void>;
	initializeDesignItems: () => Promise<void>;
}

export const useStoreState = create<StoreState>()(
	persist(
		(set, get) => ({
			store: {
				store_name: "",
				account_manager: "",
				store_address: "",
				main_client_name: "",
				main_client_contact_number: "",
				store_code: "",
				start_date: "",
				end_date: "",
				status: "",
			},
			designList: [],
			category_list: [],
			added_products: {},
			isInitialized: false,

			// Actions
			setDesignList: (designItems) =>
				set({ designList: designItems }),

			setCategoryList: (categories) => set({ category_list: categories }),

			setInitialized: (flag) => set({ isInitialized: flag }),

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

			setStore: async (store_code: string) => {
				const currentStoreCode = get().store.store_code;
				const newStoreCode = store_code;

				let store = get().store;

				if (currentStoreCode && currentStoreCode !== newStoreCode) {
					console.log(
						`[Zustand] Store code changed: ${currentStoreCode} → ${newStoreCode}. Resetting...`
					);
					get().resetStoreState(); // wipes previous data

					store = await fetchStore(newStoreCode);
					if (!store) {
						console.error(`[Zustand] Failed to fetch store: ${newStoreCode}`);
						return;
					}
				}
				set({
					store: store,
					isInitialized: false,
				});
				try {
					await Promise.all([
						get().initializeProductsFromServer(newStoreCode),
						get().loadInitialCategoryList(newStoreCode),
						get().initializeDesignItems(),
					]);
					set({ isInitialized: true });
					console.log(`[Zustand] Store fully initialized for: ${newStoreCode}`);
				} catch (error) {
					console.error(`[Zustand] Store initialization failed:`, error);
				}
			},

			removeProduct: (designId, productId) => {
				const currentProducts = get().added_products[designId] || [];
				const updatedProducts = currentProducts.filter(
					(p) => `${p.productId}` !== productId
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
					store: {
						store_name: "",
						account_manager: "",
						store_address: "",
						main_client_name: "",
						main_client_contact_number: "",
						store_code: "",
						start_date: "",
						end_date: "",
						status: "",
					},
					designList: [],
					category_list: [],
					added_products: {},
					isInitialized: false,
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

			initializeDesignItems: async () => {
				const fetchDesignItems = async () => {
					const response = await fetch("/api/initial_fetch/get_design_items", {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							store_code: get().store.store_code,
						})
					});
					console.log("Response from get_design_items API:", response);
					if (!response.ok) {
						throw new Error("Failed to fetch design items");
					}
					const design_items = await response.json();
					return design_items.designItems;
				};

				try {
					const designItems = await fetchDesignItems();
					console.log("Fetched design items:", designItems);
					get().setDesignList(designItems);
				} catch (error) {
					console.error("Error fetching design items:", error);
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
