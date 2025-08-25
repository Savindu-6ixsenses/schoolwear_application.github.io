// Props for creating a store in the database
export interface StoreCreationProps {
	store_name: string;
	account_manager: string;
	store_address: string;
	main_client_name: string;
	main_client_contact_number: string;
	store_code: string;
	start_date: string;
	end_date: string;
	status: string;
}

// Props for response return after creating a store
export interface CreateStoreResponse {
	data: {
		category_id: number;
		category_uuid: string;
		parent_id: number;
		tree_id: number;
		name: string;
		description: string;
		views: number;
		sort_order: number;
		page_title: string;
		meta_keywords: string[];
		meta_description: string;
		layout_file: string;
		image_url: string;
		is_visible: boolean;
		search_keywords: string;
		default_product_sort: string;
		url: {
			path: string;
			is_customized: boolean;
		};
	}[];
	meta: {
		total: number;
		success: number;
		failed: number;
	};
}

export type FormData = {
	schoolName: string;
	streetAddress: string;
	addressLine2: string;
	city: string;
	provinceState: string;
	postalCode: string;
	country: string;
	firstName: string;
	lastName: string;
	email: string;
	contactNumber: string;
	storeCode: string;
};


