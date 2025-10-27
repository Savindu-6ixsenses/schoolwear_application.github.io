import { checkUserCreatePermission } from "@/app/actions/userActions";
import { handleCreateStore } from "@/handlers/bigcommerce/createStoreHandler";
import { createSignedDownloadUrl } from "@/services/logging/logsStorage";
import { StoreCreationProps } from "@/types/store";
import { LogManager } from "@/utils/logging/logManager";
import { StoreCreationLogger } from "@/utils/logging/storeCreationLogger";
import { StoreReportGenerator } from "@/utils/reports/storeReportGenerator";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	const canCreateStore = await checkUserCreatePermission();

	if (!canCreateStore) {
		return NextResponse.json(
			{ message: "User does not have permission to create a store." },
			{ status: 403 }
		);
	}
	
	const { store, category_list }: { store: StoreCreationProps; category_list: string[] } = await req.json();

	const logger = LogManager.createLogger(store.store_code, store.store_name);
	const reportGenerator = LogManager.createReportGenerator(store.store_code, store.store_name);

	const logPath = `${store.store_code}/store-creation-log-${store.store_code}.txt`;
	const reportPath = `${store.store_code}/store-report-${store.store_code}.csv`;

	let finalLogger: StoreCreationLogger = logger;
	let finalReportGenerator: StoreReportGenerator = reportGenerator;

	try {
		logger.logStoreCreationStart(store);

		// Run the creation process
		const result = await handleCreateStore(store, category_list, logger, reportGenerator);
		finalLogger = result.logger;
		finalReportGenerator = result.reportGenerator;

		if (result.error) {
			throw result.error;
		}

		// Save to in-memory manager
		LogManager.saveLog(store.store_code, finalLogger.getLog());
		LogManager.saveReport(store.store_code, finalReportGenerator.getReportData());

		// Upload to Supabase Storage
		await LogManager.uploadArtifactsToSupabaseStorage(store.store_code);

		// Generate signed URLs
		const [logUrl, reportUrl] = await Promise.all([
			createSignedDownloadUrl(logPath),
			createSignedDownloadUrl(reportPath),
		]);

		return NextResponse.json(
			{
				message: "Store and products created successfully.",
				logUrl: logUrl || "",
				reportUrl: reportUrl || "",
			},
			{ status: 201 }
		);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error("API Error:", error);

		// Save log/report even on failure
		LogManager.saveLog(store.store_code, finalLogger.getLog());
		LogManager.saveReport(store.store_code, finalReportGenerator.getReportData());

		try {
			await LogManager.uploadArtifactsToSupabaseStorage(store.store_code);
		} catch (uploadError) {
			console.error("Upload failed after error:", uploadError);
		}

		const [logUrl, reportUrl] = await Promise.all([
			createSignedDownloadUrl(logPath),
			createSignedDownloadUrl(reportPath),
		]);

		if (error.message?.includes("Store creation error")) {
			return NextResponse.json(
				{
					message: "Store creation error",
					error: error.message,
					logUrl: logUrl || "",
					reportUrl: reportUrl || "",
				},
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{
				message: "Internal server error",
				error: error.message,
				logUrl: logUrl || "",
				reportUrl: reportUrl || "",
			},
			{ status: 500 }
		);
	}
}
