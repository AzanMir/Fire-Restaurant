import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public paths — always allow
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon")
  ) {
    // Redirect authenticated users away from auth pages
    if (
      user &&
      (pathname === "/login" ||
        pathname === "/signup" ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password"))
    ) {
      const role = await getUserRole(supabase, user.id);
      return NextResponse.redirect(
        new URL(role === "admin" ? "/admin/dashboard" : "/staff/dashboard", request.url)
      );
    }
    return response;
  }

  // Protected paths — require auth
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = await getUserRole(supabase, user.id);

  // Role-based access
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/staff/dashboard", request.url));
  }

  if (pathname.startsWith("/staff") && role !== "staff" && role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

async function getUserRole(supabase, userId) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role ?? "staff";
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|icons|images|sounds).*)",
  ],
};
