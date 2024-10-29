import { createClient } from '../../utils/supabase/ssr_client/client';

export async function createStore(storeData: any) {
  const supabase = createClient();
  const { data, status, statusText, error } = await supabase
  .from('Stores')
  .insert([{...storeData, created_at: new Date(), updated_at: new Date()}])
  .select();
  console.log(`Data and Error: ${JSON.stringify(data)} ${status} ${statusText}`);
  if (error) {
    throw new Error(`Failed to create store: ${error.message}`);
  }

  return {data, status, statusText};
}
