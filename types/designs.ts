// Define types based on your new schema for better type safety
export type DesignGuideline = {
	id: string;
	created_at: string;
	updated_at: string;
	design_guideline: string;
	design_description: string;
	reference_image: string | null;
};

export type Design = {
	design_id: string;
	Design_Guideline: string;
	Image_URL: string | null;
	user_id: string;
	height: number | null;
	width: number | null;
	store_code: string;
	Design_Name: string;
};

export type CreateDesignParams = {
	designId: string;
	designGuideline: string;
    designName: string;
	imageUrl: string;
	storeCode: string;
	height?: number;
	width?: number;
};

export type DesignView = {
    design_id: string;
    design_guideline: string;
    design_description: string;
    image_url: string | null;
    height: number | null;
    width: number | null;
    design_name: string;
    store_code?: string;
	notes: string | null;
}