import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Protecting all routes under the dashboard route group
const isDashboardRoute = createRouteMatcher([
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
  const { nextUrl } = req;
  
  // Trace execution in Vercel logs
  console.log(`[Middleware] Processing request for: ${nextUrl.pathname}`);

  try {
    const isPublic = !isDashboardRoute(req);
    
    if (!isPublic) {
      console.log(`[Middleware] Protected route detected, checking auth for: ${nextUrl.pathname}`);
      await auth.protect();
    }

    // Set the pathname in headers so RSC layout can access it
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", nextUrl.pathname);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("[Middleware] Error processing request:", error);
    // Let Clerk handle redirects if it's an auth error, else re-throw so Vercel can show the error
    throw error;
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/api/(.*)",
  ],
};

