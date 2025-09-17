import { checkUserCreatePermission } from "@/app/actions/userActions";
import StoreReportClient from "./StoreReportClient";

const StoreReportPage = async ({params}: {params: {store_code: string}}) => {
	const canCreateStore = await checkUserCreatePermission();

	return <StoreReportClient canCreateStore={canCreateStore} storeCode={params.store_code}/>;
};

export default StoreReportPage;