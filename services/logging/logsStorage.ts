"use server";

// utils/logging/persistence/storage.ts
import { createClient } from "@/utils/supabase/ssr_client/server"; // adjust to your path

type ArtifactKind = "log" | "report";

function objectPath(storeCode: string, kind: ArtifactKind) {
	return kind === "log"
		? `${storeCode}/store-creation-log-${storeCode}.txt`
		: `${storeCode}/store-report-${storeCode}.csv`;
}

/**
 * Upload plain text (log) to Supabase Storage.
 * Bucket must exist: logs-report
 */
export async function uploadLogTextToStorage(
	storeCode: string,
	logText: string
) {
	const supabase = await createClient();
	const path = objectPath(storeCode, "log");

	// List the available buckets in supabase
	const bucketRequest = await supabase.storage.listBuckets();

	console.log("Available Buckets:", bucketRequest.data);
	console.log("Bucket Error:", bucketRequest.error);

	const { error } = await supabase.storage
		.from("logs-reports")
		.upload(path, new Blob([logText], { type: "text/plain" }), {
			upsert: true,
			contentType: "text/plain",
		});

	if (error) {
    throw new Error(`Error [Log] :${error.message}`);};
	return { path };
}

/**
 * Upload CSV (report) to Supabase Storage.
 * Bucket must exist: logs-report
 */
export async function uploadReportCsvToStorage(storeCode: string, csv: string) {
	const supabase = await createClient();
	const path = objectPath(storeCode, "report");

	// List the available buckets in supabase
	const bucketRequest = await supabase.storage.listBuckets();

	console.log("Available Buckets:", bucketRequest.data);
	console.log("Bucket Error:", bucketRequest.error);

	const { error } = await supabase.storage
		.from("logs-reports")
		.upload(path, new Blob([csv], { type: "text/csv" }), {
			upsert: true,
			contentType: "text/csv",
		});

	if (error) {
    throw new Error(`Error [Report] :${error.message}`);};
	return { path };
}

/**
 * Optional: create a short‑lived signed URL for download links.
 */
export async function createSignedDownloadUrl(
	path: string,
	expiresInSeconds = 60 * 10 // 10 minutes
) {
	const supabase = await createClient();
	const { data, error } = await supabase.storage
		.from("logs-reports")
		.createSignedUrl(path, expiresInSeconds);

	if (error) {
    throw new Error(`Error [Signed_URL] :${error.message}`);};
	return data.signedUrl;
}
