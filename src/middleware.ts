import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute     = createRouteMatcher(["/","/feed(.*)", "/sign-in(.*)", "/sign-up(.*)", "/api/auth/webhook"]);
const isOnboardingRoute = createRouteMatcher(["/Onboarding(.*)"]);
const isApiRoute        = createRouteMatcher(["/api/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    if (isPublicRoute(req)) return NextResponse.next();
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isApiRoute(req)) return NextResponse.next();

  const isOnboarded = (sessionClaims?.metadata as { onboarded?: boolean })?.onboarded === true;

  // Not onboarded — force to onboarding
  if (!isOnboarded && !isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL("/Onboarding", req.url));
  }

  // Already onboarded — block re-visiting onboarding
  if (isOnboarded && isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL("/feed", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};