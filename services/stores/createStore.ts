import { StoreCreationProps } from '@/types/store';
import { createClient } from '../../utils/supabase/ssr_client/client';

export async function createStore(storeData: StoreCreationProps) {
  const supabase = createClient();
  const { data, status, statusText, error } = await supabase
  .from('stores')
  .insert([{...storeData, created_at: new Date(), updated_at: new Date()}])
  .select();
  console.log(`Data and Error: ${JSON.stringify(data)} ${status} ${statusText}`);
  if (error) {
    throw new Error(`Failed to create store: ${error.message}`);
  }

  return {data, status, statusText};
}

export async function updateStore(storeData: any) {
  const supabase = createClient();
  const { data, status, statusText, error } = await supabase
  .from('stores')
  .update({...storeData, updated_at: new Date()})
  .eq('store_code', storeData.store_code)
  .select();
  console.log(`Data and Error: ${JSON.stringify(data)} ${status} ${statusText}`);
  if (error) {
    throw new Error(`Failed to update store: ${error.message}`);
  }

  return {data, status, statusText};
}

export async function updateStoreStatus(storeCode: string, status: string) {
  const supabase = createClient();
  const { data, status: status2, statusText, error } = await supabase
  .from('stores')
  .update({status:status, updated_at: new Date()})
  .eq('store_code', storeCode)
  .select();
  console.log(`Data and Error: ${JSON.stringify(data)} ${status2} ${statusText}`);
  if (error) {
    throw new Error(`Failed to update store status: ${error.message}`);
  }

  return {data};
}
