

export interface ProductCreationProps {
    name: string; // Required
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
    brand_name?: string;
    inventory_level?: number;
    inventory_warning_level?: number;
    inventory_tracking?: "none" | "product" | "variant";
    fixed_cost_shipping_price?: number;
    is_free_shipping?: boolean;
    is_visible?: boolean;
    is_featured?: boolean;
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
    custom_url?: string;
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
}