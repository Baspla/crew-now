import { NextRequest, NextResponse } from "next/server"
import { authConfig } from "./auth.config"
import NextAuth from "next-auth"
 
const { auth } = NextAuth(authConfig)
const PROTECTED_PREFIXES = ["/create", "/feed", "/profile", "/post", "/settings", "/reactions", "/moments"]

export default auth(async function middleware(req: NextRequest) {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  // @ts-expect-error - provided by next-auth
  const isLoggedIn = !!req.auth

  if (!isLoggedIn && isProtected) {
    // Redirect to our custom login UI, carrying a callbackUrl param
    const loginUrl = new URL("/login", nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", nextUrl.href)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})
export const config = {
  // Standard matcher that excludes static assets and Next internals
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}