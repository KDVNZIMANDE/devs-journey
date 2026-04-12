import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute    = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/api/auth/webhook"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isApiRoute        = createRouteMatcher(["/api/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Unauthenticated — only allow public routes
  if (!userId) {
    if (isPublicRoute(req)) return NextResponse.next();
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Skip onboarding check for API routes
  if (isApiRoute(req)) return NextResponse.next();

  // Check cookie first — avoids a DB call on every request
  const onboardingCookie = req.cookies.get("Onboarding_complete")?.value;
  const isOnboarded = onboardingCookie === "true";

  if (isOnboarded) {
    // Cookie confirms onboarding is done — block re-visiting onboarding
    if (isOnboardingRoute(req)) {
      return NextResponse.redirect(new URL("/feed", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};