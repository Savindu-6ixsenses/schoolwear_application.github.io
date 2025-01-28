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

// Props for Design Items in the Database
// These design items are used to identify the design of a product
export interface DesignItemProps {
	Design_Id: string;
	Design_Guideline: string;
	Image_URL: string;
	Design_Description: string
}

// Props for response return after creating a store
export interface CreateStoreResponse  {
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
  };
  
