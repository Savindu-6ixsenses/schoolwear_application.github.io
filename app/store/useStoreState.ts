// store/useStoreState.ts
/**
 * Central client-side workspace for the active store-creation flow.
 * This Zustand store keeps the selected store metadata, grouped products,
 * related categories, and design items in sync across report and editing screens,
 * while persisting enough local state to survive navigation within the app.
 */
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

	setStoreStatus: (status: string) => void;
	setInitialized: (flag: boolean) => void;
	setStore: (store_code: string) => void;
	setDesignList: (designList: DesignView[]) => void;
	setCategoryList: (categories: string[]) => void;
	addProduct: (designId: string, product: StoreProductReport) => void;
	updateProduct: (designId: string, sage_code: string, updatedFields: Partial<StoreProductReport>) => void;
	removeProduct: (designId: string, sage_code: string) => void;
	resetStoreState: () => void;
	loadInitialCategoryList: (store_code: string) => Promise<void>;
	initializeProductsFromServer: (store_code: string) => Promise<void>;
	initializeDesignItems: (store_code: string) => Promise<void>;
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

			setStoreStatus: (status) =>
				set((state) => ({
					store: {
						...state.store,
						status: status,
					},
				})),

			setDesignList: (designItems) =>
				set({ designList: designItems }),

			setCategoryList: (categories) => set({ category_list: categories }),

			setInitialized: (flag) => set({ isInitialized: flag }),

			addProduct: (designId, product) => {
				const currentProducts = get().added_products[designId] || [];
				const exists = currentProducts.some(
					(p) => p.sage_code === product.sage_code
				);

				if (!exists) {
					const updatedProducts = [...currentProducts, product];
					set({
						added_products: {
							...get().added_products,
							[designId]: updatedProducts,
						},
					});

					// Category filters are built from the in-memory product set, so new categories must be added eagerly.
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

			updateProduct: (designId, sage_code, updatedFields) => {
				const currentProducts = get().added_products[designId] || [];
				const productIndex = currentProducts.findIndex(
					(p) => p.sage_code === sage_code
				);

				if (productIndex !== -1) {
					const updatedProducts = [...currentProducts];
					updatedProducts[productIndex] = {
						...updatedProducts[productIndex],
						...updatedFields,
					};

					set({
						added_products: {
							...get().added_products,
							[designId]: updatedProducts,
						},
					});
				}
			},

			/**
			 * Re-initializes the persisted store workspace for the requested store code.
			 * Switching stores clears the previous store's cached products/designs before fresh data is loaded.
			 */
			setStore: async (store_code: string) => {
				const currentStoreCode = get().store.store_code;
				const newStoreCode = store_code;

				if (currentStoreCode !== newStoreCode) {
					console.log(
						`[Zustand] Store code changed or initializing: ${
							currentStoreCode || '""'
						} → ${newStoreCode}.`
					);
					get().resetStoreState(); // wipes previous data
				}

				// Store metadata is always re-fetched so persisted local state does not outlive server changes.
				const store = await fetchStore(newStoreCode);
				if (!store) {
					console.error(`[Zustand] Failed to fetch store: ${newStoreCode}`);
					return;
				}
				set({ store: store });

				set({ isInitialized: false });
				try {
					// The store is not considered usable until products, categories, and designs have all been hydrated.
					await Promise.all([
						get().initializeProductsFromServer(newStoreCode),
						get().loadInitialCategoryList(newStoreCode),
						get().initializeDesignItems(newStoreCode),
					]);

					set({ isInitialized: true });
					console.log(`[Zustand] Store fully initialized for: ${newStoreCode}`);
					// Print the Initialized Results
					console.log("[Zustand] Current Store State:", get().store);
					console.log("[Zustand] Current Design List:", get().designList);
					console.log("[Zustand] Current Categories:", get().category_list);
					console.log("[Zustand] Current Added Products:", get().added_products);
				} catch (error) {
					console.error(`[Zustand] Store initialization failed:`, error);
				}
			},

			removeProduct: (designId, sage_code) => {
				const currentProducts = get().added_products[designId] || [];
				const updatedProducts = currentProducts.filter(
					(p) => `${p.sage_code}` !== sage_code
				);

				if (updatedProducts.length < currentProducts.length) {
					set({
						added_products: {
							...get().added_products,
							[designId]: updatedProducts,
						},
					});
					console.log(
						`[Zustand] Product removed from design ${designId}: ${sage_code}`
					);
				}
			},

			/**
			 * Clears the persisted workspace back to an empty shell.
			 * This is primarily used when navigating between store codes to avoid mixing data across stores.
			 */
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
					
					// An empty product payload means the store should start with no derived categories.
					if (Object.keys(designItems).length === 0) {
						console.warn("[Zustand] No products found for the store");
						set({ category_list: [] }); // Reset categories if no products
						return;
					}

					// Categories are derived from the loaded product payload so filters match what is actually present.
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

			initializeDesignItems: async (store_code: string) => {
				const fetchDesignItems = async () => {
					const response = await fetch("/api/initial_fetch/get_design_items", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ store_code }),
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
					console.log("Fetched design items on initial fetch:", designItems);
					get().setDesignList(designItems);
				} catch (error) {
					console.error("Error fetching design items:", error);
				}
			},
		}),
		{
			name: "store-state", // localStorage key
			// Initialization is intentionally transient so each page load can revalidate server-backed data.
			partialize: (state) => ({ ...state, isInitialized: false }),
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
