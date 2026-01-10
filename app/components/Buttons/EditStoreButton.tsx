import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation';
import React from 'react'

const EditStoreButton = ({store_status,store_code}: {store_status: string, store_code: string}) => {

    const router = useRouter();

    if (store_status.toLowerCase() === 'approved') {
        return null; // Do not render the button if store is approved
    }

  return (
    <div className='px-2'><Button onClick={() => router.push(`/?storeCode=${store_code}&edit=true`)}>Edit Store</Button></div>
  )
}

export default EditStoreButton