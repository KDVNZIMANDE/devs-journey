import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Routes that require authentication.
 * All /feed, /projects, /profile, /celebration-wall routes are protected.
 * Auth routes (/sign-in, /sign-up) and the landing page are public.
 */
const isProtectedRoute = createRouteMatcher([
  "/feed(.*)",
  "/projects(.*)",
  "/profile(.*)",
  "/celebration-wall(.*)",
  "/api/projects(.*)",
  "/api/milestones(.*)",
  "/api/comments(.*)",
  "/api/feed(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
