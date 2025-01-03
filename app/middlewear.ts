import { type NextRequest } from 'next/server'
import { updateSession } from '../utils/supabase/middlewear'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!login|_next/image|_next/static|favicon.ico).*)'], // Apply to all paths except for login and static files
};
