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
import { useStoreState } from "../store/useStoreState";
import { StoreProductReport } from "@/types/products";
import CreateStore from "./CreateStore";

// Helper to fetch a signed URL from your API
const fetchSignedUrl = async (type: "log" | "report", storeCode: string) => {
	const res = await fetch(
		`/api/get-signed-url?type=${type}&storeCode=${storeCode}`
	);
	if (!res.ok) return null;
	const data = await res.json();
	return data.signedUrl;
};

export const StoreReportComponent = () => {
	const { store, added_products, category_list } = useStoreState();
	const [logUrl, setLogUrl] = useState<string | null>(null);
	const [reportUrl, setReportUrl] = useState<string | null>(null);
	const [logUrlExpiry, setLogUrlExpiry] = useState<number | null>(null);
	const [reportUrlExpiry, setReportUrlExpiry] = useState<number | null>(null);

	const all_products: StoreProductReport[] =
		Object.values(added_products).flat();

	const downloadLog = async () => {
		const success = LogManager.downloadLogFile(store.store_code);
		if (success) {
			toast.success("Store Creation log downloaded successfully.");
		} else {
			// Not in local, try to get from Supabase
			const now = Date.now();
			if (logUrl && logUrlExpiry && now < logUrlExpiry) {
				window.open(logUrl, "_blank");
				return;
			}
			const url = await fetchSignedUrl("log", store.store_code);
			if (url) {
				setLogUrl(url);
				setLogUrlExpiry(now + 10 * 60 * 1000); // 5 minutes
				window.open(url, "_blank");
			}
		}
	};

	const downloadReport = async () => {
		const success = LogManager.downloadReportCSV(store.store_code);
		if (success) {
			toast.success("Store Report downloaded successfully.");
		} else {
			// Not in local, try to get from Supabase
			const now = Date.now();
			if (reportUrl && reportUrlExpiry && now < reportUrlExpiry) {
				window.open(reportUrl, "_blank");
				return;
			}
			const url = await fetchSignedUrl("report", store.store_code);
			if (url) {
				setReportUrl(url);
				setReportUrlExpiry(now + 10 * 60 * 1000); // 5 minutes
				window.open(url, "_blank");
			}
		}
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
								<div className="text-2xl font-bold text-primary">
									{all_products ? all_products.length : 0}
								</div>
								<div className="text-sm text-muted-foreground">Products</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">
									{category_list ? category_list.length : 0}
								</div>
								<div className="text-sm text-muted-foreground">Categories</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-primary">
									{store.store_code}
								</div>
								<div className="text-sm text-muted-foreground">Store Code</div>
							</div>
						</div>

						<div className="space-y-4">
							{Object.entries(added_products).length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No products added yet.
								</p>
							) : (
								Object.entries(added_products).map(([designId, products]) => {
									return (
										<div
											key={designId}
											className="border rounded p-3 bg-muted/50"
										>
											<div className="mb-2 flex items-center gap-2">
												<span className="font-semibold">Design ID:</span>
												<span className="text-primary">{designId}</span>
												<Badge
													variant="outline"
													className="ml-2"
												>
													Guideline: {products[0].designGuideline}
												</Badge>
											</div>
											<div className="space-y-2 pl-4">
												{products.map((product, idx) => (
													<div
														key={product.productId || idx}
														className="flex items-center justify-between p-2 border rounded bg-white"
													>
														<div>
															<span className="font-medium">
																{product.productName}
															</span>
															<Badge
																variant="secondary"
																className="ml-2 bg-slate-300"
															>
																{product.category}
															</Badge>
															{product.sizeVariations &&
																product.sizeVariations
																	.split(",")
																	.map((size) => (
																		<Badge
																			key={size.trim()}
																			variant="secondary"
																			className="ml-1"
																		>
																			{size}
																		</Badge>
																	))}
														</div>
													</div>
												))}
											</div>
										</div>
									);
								})
							)}
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex gap-2">
					<CreateStore
						store={store}
						category_list={category_list}
						setLogUrl={setLogUrl}
						setReportUrl={setReportUrl}
					/>
					<Button
						variant="outline"
						onClick={downloadLog}
						className="flex items-center gap-2"
					>
						<FileText className="h-4 w-4" />
						Download Log
					</Button>
					<Button
						variant="outline"
						onClick={downloadReport}
						className="flex items-center gap-2"
					>
						<Download className="h-4 w-4" />
						Download Report
					</Button>
				</CardFooter>
			</Card>

			{!logUrl && !reportUrl && (
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
