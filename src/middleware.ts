import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * PRODUCTION-HARDENED MIDDLEWARE
 * This middleware is optimized for Next.js 15 + Clerk v7 + Vercel Edge Runtime.
 * It follows the "Fail Open" principle to ensure the app never crashes at the middleware layer.
 */

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)", 
  "/proposals(.*)", 
  "/contracts(.*)", 
  "/clients(.*)", 
  "/reports(.*)", 
  "/invoices(.*)", 
  "/billing(.*)", 
  "/settings(.*)", 
  "/onboarding(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // Trace hit
  // console.log(`[Middleware] Hit: ${req.nextUrl.pathname}`);

  try {
    // 1. HARDENED AUTH CHECK
    // In Clerk v6/v7, auth is a function (auth()). Calling .protect() on the function itself crashes.
    if (isProtectedRoute(req)) {
      await auth().protect();
    }

    // 2. SET PATHNAME IN HEADERS (For use in Server Components)
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", req.nextUrl.pathname);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error: any) {
    // 3. FAIL-SAFE LOGIC
    
    // Check if error is a standard Next.js or Clerk redirect
    // We MUST re-throw these for the authentication flow to work correctly.
    if (
      error && 
      (error.digest?.startsWith('NEXT_REDIRECT') || 
       error.name === 'Error' && error.message.includes('NEXT_REDIRECT') ||
       error.__clerk_is_redirect)
    ) {
      throw error;
    }

    // Log the error for triage but don't crash
    console.error(`[MIDDLEWARE FATAL ERROR for ${req.nextUrl.pathname}]:`, error);

    // Fail open: let the request through. Page-level auth will act as a last defense.
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Optimized matcher for Next.js 15
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/api/(.*)",
  ],
};
