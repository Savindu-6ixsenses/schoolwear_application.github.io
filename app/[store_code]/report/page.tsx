import { checkUserCreatePermission } from "@/app/actions/userActions";
import StoreReportClient from "./StoreReportClient";

/**
 * Resolves create permission on the server so the client only receives the final
 * capability flag and never has to evaluate authorization on its own.
 */
const StoreReportPage = async ({params}: {params: {store_code: string}}) => {
	const canCreateStore = await checkUserCreatePermission();

	return <StoreReportClient canCreateStore={canCreateStore} storeCode={params.store_code}/>;
};

export default StoreReportPage;
