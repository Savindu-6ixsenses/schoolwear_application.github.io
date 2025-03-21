'use client';

// components/LogoutButton.tsx
import { createClient } from '../../utils/supabase/ssr_client/client';
import { useRouter } from 'next/navigation';

const LogoutButton: React.FC = () => {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login'); 
  };

  return (
    <button onClick={handleLogout} className="bg-red-500 text-white mx-3 px-4 py-2 rounded">
      Logout
    </button>
  );
};

export default LogoutButton;
