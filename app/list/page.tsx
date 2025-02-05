import React from 'react';
import { createClient } from '@/utils/supabase/ssr_client/server';
import ListItem from './ListItem';

const ListPage = async () => {

  const supabase = createClient();

  const { data, error } = await supabase.from('stores').select('*');

  console.log(error);

  return (
    <div className="space-y-3 p-4" >
      {data?.map((item) => (
        <ListItem key={item.store_code} item={item} />
      ))}
    </div>
  );
};


export default ListPage;
