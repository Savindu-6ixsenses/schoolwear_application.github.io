import React from 'react';
import { createClient } from '@/utils/supabase/ssr_client/server';
import { StoreCreationProps } from '@/types/store'
import ListItem from './ListItem';

interface ListPageProps {
  data: StoreCreationProps[];
}

const ListPage = async () => {

  const supabase = createClient();

  const { data, error } = await supabase.from('stores').select('*');

  console.log(error);

  return (
    <div className="space-y-3 p-4" >
      {data?.map((item) => (
        <ListItem item={item} />
      ))}
    </div>
  );
};


export default ListPage;
