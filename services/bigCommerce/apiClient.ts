export const addToBigCommerce = async (url: string, method: string, body?: unknown) => {
  const token = process.env.BIGCOMMERCE_ACCESS_TOKEN ?? "";

  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Auth-Token": token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `BigCommerce API Error: ${response.status} - ${response.statusText}, Response: ${errorText}`
    );
  }

  return await response.json();
};
