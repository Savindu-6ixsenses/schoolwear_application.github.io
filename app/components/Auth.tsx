// components/Auth.tsx
import { Auth } from '@supabase/auth-ui-react';
import { createClient } from '../../utils/supabase/ssr_client/client';
import {ThemeSupa} from '@supabase/auth-ui-shared';

const AuthComponent: React.FC = () => {
    const supabase = createClient();
  return (
    <Auth
      supabaseClient={supabase}
      providers={['github', 'google']}
      appearance={{ theme: ThemeSupa }}
      redirectTo="http://localhost:3000/" // Update with your base URL
    />
  );
};

export default AuthComponent;
