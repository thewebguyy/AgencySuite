import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Protecting all routes under the dashboard route group
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)", "/proposals(.*)", "/contracts(.*)", "/clients(.*)", "/reports(.*)", "/invoices(.*)", "/billing(.*)", "/settings(.*)", "/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { nextUrl } = req;
  const isPublic = !isDashboardRoute(req);
  
  if (!isPublic) {
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
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
