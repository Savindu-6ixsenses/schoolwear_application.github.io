"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../utils/supabase/ssr_client/server";

//TODO: Fix this action
export async function get_products_list(
	in_store_code: string,
	in_design_id: string
) {
	const supabase = createClient();

	const { data: user, error: auth_error } = await supabase.auth.getUser();
	if (auth_error || !user?.user) {
		console.error("AN error is happening", auth_error);
		redirect("/login");
	}

	let { data, error } = await supabase.rpc("get_store_products", {
		in_store_code: in_store_code,
		in_design_id: in_design_id,
	});
	if (error) console.error(error);
	else console.log("Products in the list are",data);
	return data;
}

export async function generate_pl(store_code: string) {
	const supabase = createClient();

	const { data: store_data, error: store_data_error } = await supabase
		.from("stores")
		.update({
			status: "Pending",
		})
		.eq("store_code", store_code)
		.select();
	if (store_data_error) console.error(store_data_error);
	else console.log(store_data);
	return store_data;
}
