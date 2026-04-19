import ProductsManager from "./ProductsManager";

/**
 * Passes through an optional deep-link SAGE code so the manager can open directly in edit mode.
 */
export default function Page({
	searchParams,
}: {
	searchParams: { sageCode?: string };
}) {
	return (
		<div className="p-6">
			<ProductsManager sageCode={searchParams.sageCode} />
		</div>
	);
}
