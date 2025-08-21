import { createClient } from "@/utils/supabase/ssr_client/server";

export async function createDesignItem(
	DesignId: string,
	Design_Guideline: string,
	Design_Description: string,
	Image_URL: string
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("User not authenticated to create a design item.");
	}

	const { data, error } = await supabase
		.from("designs")
		.insert([
			{
				user_id: user.id,
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

export async function getAddedDesignList(store_code: string) : Promise<string[]> {
	const supabase = await createClient();

	// Fetch design data
	const { data: design_data, error: designError } = await supabase
		.from("stores_products_designs_2")
		.select("*")
		.eq("Store_Code", store_code);

	if (designError) {
		throw new Error(`Failed to fetch added design list: ${designError.message}`);
	}

	const designList: string[] = Array.from(
		new Set((design_data || []).map((d) => d?.["Design_ID"]).filter(Boolean))
	);

	return designList;
}
