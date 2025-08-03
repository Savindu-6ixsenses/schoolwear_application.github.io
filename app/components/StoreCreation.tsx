import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Table2 } from "lucide-react";
import { LogManager } from "@/utils/logging/logManager";
import { toast } from "react-hot-toast";

interface DemoProduct {
	productName: string;
	category: string;
	parentSageCode: string;
	sizeVariations: string;
	brandName: string;
	productDescription: string;
}

export const StoreCreationDemo = () => {
	const [isCreating, setIsCreating] = useState(false);
	const [currentStoreCode, setCurrentStoreCode] = useState<string | null>(null);

	// Demo data based on your logs
	const demoProducts: DemoProduct[] = [
		{
			productName: "Adult Actiflex Short Sleeve Shirt - Black",
			category: "Adult",
			parentSageCode: "CVE-012-BK",
			sizeVariations: "XS,S,M,L,XL,XXL",
			brandName: "Athletic Knit",
			productDescription: "Premium quality actiflex short sleeve shirt",
		},
		{
			productName: "Adult 100% Cotton T-Shirt - Red",
			category: "Adult",
			parentSageCode: "EVN-001-RE",
			sizeVariations: "S,M,L,XL",
			brandName: "Gildan",
			productDescription: "Classic 100% cotton t-shirt",
		},
		{
			productName: "Adult 100% Cotton Long Sleeve Shirt - Red",
			category: "Adult",
			parentSageCode: "EVN-002-RE",
			sizeVariations: "S,M,L,XL,XXL",
			brandName: "Gildan",
			productDescription: "Comfortable long sleeve cotton shirt",
		},
	];

	const simulateStoreCreation = async () => {
		setIsCreating(true);
		const storeCode = "SAC1";
		const storeName = "St Annes College";

		// Create logger and report generator
		const logger = LogManager.createLogger(storeCode, storeName);
		const reportGenerator = LogManager.createReportGenerator(
			storeCode,
			storeName
		);

		try {
			// Simulate the store creation process with realistic delays
			logger.logStoreCreationStart(
				{
					store_name: storeName,
					store_code: storeCode,
					account_manager: "Savindu@6ixsenses.com",
					start_date: "2025-07-07T18:38:46.180Z",
					end_date: "2025-08-07T18:38:45.886Z",
				},
				"2f84ab83-7d5c-467e-ac99-3063c59e2710",
				["Adult", "Youth"]
			);

			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Simulate category creation
			logger.logCategoryCreation(12345, ["Adult", "Youth"]);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// Simulate product fetching
			logger.logProductFetch(storeCode, demoProducts.length);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// Process each product
			let successfulProducts = 0;
			for (let i = 0; i < demoProducts.length; i++) {
				const product = demoProducts[i];
				const newSageCode = `${storeCode}-${String(i + 1).padStart(3, "0")}-${
					product.parentSageCode.split("-")[2]
				}`;
				const finalName = `${storeCode} ${product.category} Grad ${
					product.productName.split(" - ")[1]
				} - Design (${i + 1})`;

				// Log processing
				logger.logProductProcessing(
					product.productName,
					{ old: product.parentSageCode, new: newSageCode },
					(i + 1).toString()
				);

				await new Promise((resolve) => setTimeout(resolve, 300));

				// Log success
				logger.logProductSuccess(product.productName, finalName, newSageCode);
				successfulProducts++;

				// Add to report
				const color = extractColorFromProductName(product.productName);
				reportGenerator.addProduct(
					newSageCode,
					finalName,
					product.category,
					color,
					product.sizeVariations,
					29.99
				);

				await new Promise((resolve) => setTimeout(resolve, 200));
			}

			// Complete with success
			logger.completeWithSuccess({
				totalProducts: demoProducts.length,
				totalCategories: 3,
				successfulProducts,
				failedProducts: 0,
			});

			// Save to LogManager
			LogManager.saveLog(storeCode, logger.getLog());
			LogManager.saveReport(storeCode, reportGenerator.getReportData());

			setCurrentStoreCode(storeCode);

			toast.success(
				`Successfully created store ${storeName} with ${successfulProducts} products.`
			);
		} catch (error) {
			logger.completeWithError(
				error instanceof Error ? error.message : "Unknown error"
			);
			LogManager.saveLog(storeCode, logger.getLog());

			toast.error(
				"An error occurred during store creation: " +
					(error instanceof Error ? error.message : "Unknown error")
			);
		} finally {
			setIsCreating(false);
		}
	};

	const downloadLog = () => {
		if (!currentStoreCode) return;

		const success = LogManager.downloadLogFile(currentStoreCode);
		if (success) {
			toast.success("Store Creation log downloaded successfully.");
		} else {
			toast.error("Could not find log file for this store.");
		}
	};

	const downloadReport = () => {
		if (!currentStoreCode) return;

		const success = LogManager.downloadReportCSV(currentStoreCode);
		if (success) {
			toast.success("Store Report downloaded successfully.");
		} else {
			toast.error("Could not find report file for this store.");
		}
	};

	const extractColorFromProductName = (name: string): string => {
		const colors = [
			"Black",
			"White",
			"Red",
			"Blue",
			"Green",
			"Yellow",
			"Purple",
			"Orange",
			"Pink",
			"Gray",
			"Grey",
		];
		const foundColor = colors.find((color) =>
			name.toLowerCase().includes(color.toLowerCase())
		);
		return foundColor || "N/A";
	};

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Table2 className="h-5 w-5" />
						Store Creation Logging Demo
					</CardTitle>
					<CardDescription>
						Demonstrates the logging functionality for store creation process.
						This creates human-readable logs and downloadable reports.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">3</div>
								<div className="text-sm text-muted-foreground">
									Demo Products
								</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">2</div>
								<div className="text-sm text-muted-foreground">Categories</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">SAC1</div>
								<div className="text-sm text-muted-foreground">Store Code</div>
							</div>
						</div>

						<div className="space-y-2">
							<h4 className="font-medium">Demo Products:</h4>
							{demoProducts.map((product, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-2 border rounded"
								>
									<div>
										<span className="font-medium">{product.productName}</span>
										<Badge
											variant="secondary"
											className="ml-2"
										>
											{product.category}
										</Badge>
										<Badge
											variant="outline"
											className="ml-1"
										>
											{product.brandName}
										</Badge>
									</div>
									<span className="text-sm text-muted-foreground">
										{product.parentSageCode}
									</span>
								</div>
							))}
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex gap-2">
					<Button
						onClick={simulateStoreCreation}
						disabled={isCreating}
						className="flex-1"
					>
						{isCreating ? "Creating Store..." : "Simulate Store Creation"}
					</Button>
					<Button
						variant="outline"
						onClick={downloadLog}
						disabled={!currentStoreCode}
						className="flex items-center gap-2"
					>
						<FileText className="h-4 w-4" />
						Download Log
					</Button>
					<Button
						variant="outline"
						onClick={downloadReport}
						disabled={!currentStoreCode}
						className="flex items-center gap-2"
					>
						<Download className="h-4 w-4" />
						Download Report
					</Button>
				</CardFooter>
			</Card>

			{currentStoreCode && (
				<Card>
					<CardHeader>
						<CardTitle>Generated Files</CardTitle>
						<CardDescription>
							Both files are ready for download and can be saved to Supabase
							when connected.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="p-4 border rounded">
								<h4 className="font-medium mb-2">Human-Readable Log</h4>
								<p className="text-sm text-muted-foreground mb-2">
									Detailed process log for business analysts and managers
								</p>
								<Badge>TXT Format</Badge>
							</div>
							<div className="p-4 border rounded">
								<h4 className="font-medium mb-2">Store Report Table</h4>
								<p className="text-sm text-muted-foreground mb-2">
									Product table with Sage codes, categories, and pricing
								</p>
								<Badge>CSV Format</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
};
