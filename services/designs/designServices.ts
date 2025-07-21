import { createClient } from "@/utils/supabase/ssr_client/server";

export async function createDesignItem(
	DesignId: string,
	Design_Guideline: string,
	Design_Description: string,
	Image_URL: string
) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("designs")
		.insert([
			{
				Design_Id: DesignId,
				Design_Guideline: Design_Guideline,
				Design_Description: Design_Description,
				Image_URL: Image_URL,
			},
		])
		.select();

	if (error) {
		throw new Error(`Failed to create design item: ${error.message}`);
	}

	return data;
}

export async function getAllDesignItems() {
	const supabase = await createClient();

	const { data, error } = await supabase.from("designs").select("*");

	if (error) {
		throw new Error(`Failed to fetch design items: ${error.message}`);
	}

	return data;
}
