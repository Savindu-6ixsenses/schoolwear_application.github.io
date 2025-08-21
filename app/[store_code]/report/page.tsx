import { checkUserCreatePermission } from "@/app/actions/userActions";
import StoreReportClient from "./StoreReportClient";

const StoreReportPage = async () => {
	const canCreateStore = await checkUserCreatePermission();

	return <StoreReportClient canCreateStore={canCreateStore} />;
};

export default StoreReportPage;