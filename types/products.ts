export interface CustomUrl {
	url: string; // Required
	is_customized: boolean; // Required
	create_redirect?: boolean;
}

export interface ProductVariant {
	cost_price?: number;
	price?: number;
	sale_price?: number;
	retail_price?: number;
	map_price?: number;
	weight?: number;
	width?: number;
	height?: number;
	depth?: number;
	is_free_shipping?: boolean;
	fixed_cost_shipping_price?: number;
	purchasing_disabled?: boolean;
	purchasing_disabled_message?: string;
	upc?: string;
	inventory_level?: number;
	inventory_warning_level?: number;
	bin_picking_number?: string;
	mpn?: string;
	gtin?: string;
	product_id?: number;
	id?: number;
	sku: string; // Required
	sku_id?: number;
	option_values?: {
		id: number; // Required
		label: string; // Required
		option_id: number; // Required
		option_display_name: string; // Required
	}[];
	calculated_price?: number;
	calculated_weight?: number;
}

export interface ProductCreationProps {
	name: string; // Required
	type: "physical" | "digital"; // Required
	sku?: string;
	description?: string;
	weight: number; // Required
	width?: number;
	depth?: number;
	height?: number;
	price: number; // Required
	cost_price?: number;
	retail_price?: number;
	sale_price?: number;
	map_price?: number;
	tax_class_id?: number;
	product_tax_code?: string;
	categories: number[]; // Required
	brand_id?: number;
	brand_name?: string;
	inventory_level?: number;
	inventory_warning_level?: number;
	inventory_tracking?: "none" | "product" | "variant";
	fixed_cost_shipping_price?: number;
	is_free_shipping?: boolean;
	is_visible?: boolean;
	is_featured?: boolean;
	related_products?: number[];
	warranty?: string;
	bin_picking_number?: string;
	layout_file?: string;
	upc?: string;
	search_keywords?: string;
	availability_description?: string;
	availability?: "available" | "disabled" | "preorder";
	gift_wrapping_options_type?: "any" | "none" | "list";
	gift_wrapping_options_list?: number[];
	sort_order?: number;
	condition?: "New" | "Used" | "Refurbished";
	is_condition_shown?: boolean;
	order_quantity_minimum?: number;
	order_quantity_maximum?: number;
	page_title?: string;
	meta_keywords?: string[];
	meta_description?: string;
	view_count?: number;
	preorder_release_date?: string;
	preorder_message?: string;
	is_preorder_only?: boolean;
	is_price_hidden?: boolean;
	price_hidden_label?: string;
	custom_url?: CustomUrl;
	open_graph_type?: string;
	open_graph_title?: string;
	open_graph_description?: string;
	open_graph_use_meta_description?: boolean;
	open_graph_use_product_name?: boolean;
	open_graph_use_image?: boolean;
	gtin?: string;
	mpn?: string;
	date_last_imported?: string;
	reviews_rating_sum?: number;
	reviews_count?: number;
	total_sold?: number;
	variants?: ProductVariant[];
}

export interface CustomField {
	id: number;
	name: string;
	value: string;
}

export interface BulkPricingRule {
	id: number;
	quantity_min: number;
	quantity_max: number;
	type: string;
	amount: number;
}

export interface Image {
	image_file: string;
	is_thumbnail: boolean;
	sort_order: number;
	description: string;
	image_url: string;
	id: number;
	product_id: number;
	url_zoom: string;
	url_standard: string;
	url_thumbnail: string;
	url_tiny: string;
	date_modified: string;
}

export interface ProductResponse {
	id: number;
	name: string;
	type: string;
	sku: string;
	description: string;
	weight: number;
	width: number;
	depth: number;
	height: number;
	price: number;
	cost_price: number;
	retail_price: number;
	sale_price: number;
	map_price: number;
	tax_class_id: number;
	product_tax_code: string;
	categories: number[];
	brand_id: number;
	inventory_level: number;
	inventory_warning_level: number;
	inventory_tracking: string;
	fixed_cost_shipping_price: number;
	is_free_shipping: boolean;
	is_visible: boolean;
	is_featured: boolean;
	related_products: number[];
	warranty: string;
	bin_picking_number: string;
	layout_file: string;
	upc: string;
	search_keywords: string;
	availability: string;
	availability_description: string;
	gift_wrapping_options_type: string;
	gift_wrapping_options_list: number[];
	sort_order: number;
	condition: string;
	is_condition_shown: boolean;
	order_quantity_minimum: number;
	order_quantity_maximum: number;
	page_title: string;
	meta_keywords: string[];
	meta_description: string;
	view_count: number;
	preorder_release_date: string;
	preorder_message: string;
	is_preorder_only: boolean;
	is_price_hidden: boolean;
	price_hidden_label: string;
	custom_url: CustomUrl;
	open_graph_type: string;
	open_graph_title: string;
	open_graph_description: string;
	open_graph_use_meta_description: boolean;
	open_graph_use_product_name: boolean;
	open_graph_use_image: boolean;
	gtin: string;
	mpn: string;
	date_last_imported: string;
	reviews_rating_sum: number;
	reviews_count: number;
	total_sold: number;
	custom_fields: CustomField[];
	bulk_pricing_rules: BulkPricingRule[];
	images: Image[];
}

export interface StoreProduct {
	productId: string;
	sageCode: string;
	productName: string;
	brandName: string;
	productDescription: string;
	productWeight: number;
	category: string;
	parentSageCode: string;
	designId?: string;
	sizeVariations: string | null;
	isAdded?: boolean;
	SM?: boolean;
	MD?: boolean;
	LG?: boolean;
	XL?: boolean;
	X2?: boolean;
	X3?: boolean;
}
