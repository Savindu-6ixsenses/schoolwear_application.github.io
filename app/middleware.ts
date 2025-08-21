import { createServerClient} from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
	// Create a response object that we can modify
	const response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	// Create a Supabase client that can read and write cookies
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach((cookie) => {
						request.cookies.set(cookie);
						response.cookies.set(cookie);
					});
				},
			},
		}
	);

	// Refresh session if expired - `getUser()` does this automatically
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const publicRoutes = ["/login", "/signup"];
	const { pathname } = request.nextUrl;

	// If user is not signed in and the current path is not public, redirect to /login
	if (!user && !publicRoutes.includes(pathname)) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// If user is signed in and the current path is a public route, redirect to the home page
	if (user && publicRoutes.includes(pathname)) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	// Return the original response, which now has the updated session cookie
	return response;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
