import ProductsManager from "./ProductsManager";

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
