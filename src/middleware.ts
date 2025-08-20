import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
  '/sejours(.*)',
  '/recettes(.*)',
  '/ingredients(.*)',
  '/api/sejours(.*)',
  '/api/recettes(.*)',
  '/api/ingredients(.*)',
  '/api/ustensiles(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Protéger les routes qui nécessitent une authentification
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}