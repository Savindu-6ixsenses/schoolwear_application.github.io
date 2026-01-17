import { de } from "date-fns/locale";

// Function to create a unique sage code
// export const createUniqueSKU_2 = (
// 	productName: string,
// 	rawsageCode: string,
// 	originalStoreCode: string,
// 	offsetNumber: number,
// 	createdSageCodes: string[]
// ): string => {
// 	if (!rawsageCode) {
// 		throw new Error("rawsageCode is required");
// 	}

// 	const sageCode = rawsageCode.includes(".")
// 		? rawsageCode.split(".")[0]
// 		: rawsageCode;

// 	// Split and validate the structure of sageCode
// 	const parts = sageCode.split("-");

// 	if (parts.length < 3) {
// 		throw new Error("Invalid sageCode format");
// 	}

// 	let designCode = parts[1];
// 	const colorCode = parts[2];

// 	// ✅ Attempt to add offsetNumber to designCode (if numeric)
// 	const designCodeNumber = parseInt(designCode, 10);

// 	if (!isNaN(designCodeNumber)) {
// 		designCode = String(designCodeNumber + offsetNumber).padStart(3, "0"); // Ensure two digits
// 	} else {
// 		// Fallback: Just append offset if not a valid number
// 		designCode = `${designCode}${offsetNumber}`;
// 	}

// 	// ✅ Create new sage code using template literals
// 	let newSageCode = `${originalStoreCode}-${designCode}-${colorCode}`;

// 	// Check if the newSageCode is unique
// 	while (createdSageCodes.includes(newSageCode)) {
// 		offsetNumber = offsetNumber + 1;
// 		designCode = String(designCodeNumber + offsetNumber).padStart(3, "0"); // Ensure two digits
// 		newSageCode = `${originalStoreCode}-${designCode}-${colorCode}`;
// 		console.log(
// 			`Duplicate sage code found. New sage code generated: ${newSageCode}`
// 		);
// 	}

// 	createdSageCodes.push(newSageCode); // Add to the list of created sage codes

// 	console.log("Product Name:", productName);

// 	console.log(`Sage Code: ${rawsageCode} => New Sage Code: ${newSageCode}`);

// 	return newSageCode;
// };

export const getCategoryOffsetNumber = (product_category: string): number => {
	switch (product_category.toLowerCase()) {
		case "adult":
			return 0;
		case "men":
			return 100;
		case "women":
			return 200;
		case "youth":
			return 300;
		case "accessories":
			return 400;
		default:
			return 0; // If there's no match, Consider it as Adult
	}
};

// Function to create a unique sage code
// Example Sage Code: ORG-001-RE (Store Code - Design Code - Color Code)
export const createUniqueSKU = (
	productName: string,
	colorCode: string,
	product_category: string,
	originalStoreCode: string,
	offsetNumber: number,
	createdSageCodes: string[]
): string => {
	let designCode: number = getCategoryOffsetNumber(product_category);
	designCode += offsetNumber;

	// ✅ Create new sage code using template literals
	let newSKU = `${originalStoreCode}-${String(designCode).padStart(3, "0")}-${colorCode}`;

	createdSageCodes.push(newSKU); // Add to the list of created sage codes

	console.log("Product Name:", productName);

	console.log(`New SKU: ${newSKU}`);

	return newSKU;
};

export const createUniqueProductNames = (
	productName: string,
	storeCode: string,
	designIndex: number,
	category_: string,
	brandName: string,
	namingMethod: string,
	namingFields: Record<string, string>
): string => {
	const brand = namingFields["brandName"] || brandName || "Default Brand";
	const category = category_;
	const subcategory = namingFields["subCategory"];
	const specialName = namingFields["specialName"];
	const printingMethod = namingFields["printingMethod"];
	const grad = namingFields["gradLabel"] || "Grad";

	// Helper to validate required fields
	const requireFields = (fields: string[]) => {
		for (const field of fields) {
			if (!namingFields[field] || namingFields[field].trim() === "") {
				throw new Error(
					`Missing required field "${field}" for naming method ${namingMethod}`
				);
			}
		}
	};

	let name = "";
	let designName = "";

	if (designIndex > 0) {
		designName = `Design (${designIndex})`;
	}

	// logging the product name and naming method
	console.log(`Product Name: ${productName}, Naming Method: ${namingMethod}`);

	// Throw an error if productName is empty
	if (!productName || productName.trim() === "") {
		throw new Error("Product name cannot be empty");
	}

	// Create the product name based on the naming method
	if (namingMethod == "1") {
		// TODO: Change this method.
		name = `${storeCode} ${brand} ${category} ${productName} ${designName}`;
	} else if (namingMethod == "2") {
		name = `${storeCode} ${category} ${productName} ${designName}`;
	} else if (namingMethod == "3") {
		requireFields(["subCategory"]);
		name = `${storeCode} ${brand} ${category} ${productName} (${subcategory}) ${designName}`;
	} else if (namingMethod == "4") {
		requireFields(["subCategory"]);
		name = `${storeCode} ${brand} ${category} ${productName} (${subcategory}) - ${designName}`;
	} else if (namingMethod == "5") {
		requireFields(["specialName"]);
		name = `${storeCode} ${category} ${specialName} ${(
			productName.split("-").pop() || ""
		).trim()} - ${designName}`;
	} else if (namingMethod == "6") {
		requireFields(["specialName", "printingMethod"]);
		name = `${storeCode} ${category} ${specialName} ${printingMethod} ${(
			productName.split("-").pop() || ""
		).trim()} - ${designName}`;
	} else if (namingMethod == "7") {
		requireFields(["specialName"]);
		name = `${storeCode} ${category} ${specialName} ${(
			productName.split("-").pop() || ""
		).trim()} - ${designName}`;
	} else if (namingMethod == "8") {
		requireFields(["gradLabel"]);
		name = `${storeCode} ${category} ${grad} ${(
			productName.split("-").pop() || ""
		).trim()} - ${designName}`;
	} else {
		throw new Error(`Invalid naming method: ${namingMethod}`);
	}

	console.log(
		`Creating product with name: "${name}" using naming method: ${namingMethod}`
	);

	return name.replace(/\s+/g, " ").trim();
};
