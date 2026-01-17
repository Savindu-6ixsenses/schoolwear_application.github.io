export const sendAPIRequestBigCommerce = async (
	url: string,
	method: string,
	body?: unknown
) => {
	const token = process.env.BIGCOMMERCE_ACCESS_TOKEN ?? "";
	let response;

	if (body) {
		response = await fetch(url, {
			method,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-Auth-Token": token,
			},
			body: body ? JSON.stringify(body) : undefined,
		});
	} else {
		response = await fetch(url, {
			method,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-Auth-Token": token,
			},
		});
	}

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`BigCommerce API Error: ${response.status} - ${response.statusText}, Response: ${errorText}`
		);
	}

	if (response.status === 204) {
		return null;
	}

	return await response.json();
};
