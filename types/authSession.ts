import { Session, AuthError } from '@supabase/supabase-js';

export type SessionData = {
  data: {
    session: Session | null;
  };
  error: AuthError | null;
};
