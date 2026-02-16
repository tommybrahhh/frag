import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    // Handle the case where the environment variable is not set
    console.error('Supabase URL environment variable is not set!');
    return response;
  }

  const cspHost = new URL(supabaseUrl).hostname;

  // Add Content Security Policy headers
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://fimgs.net https://upload.wikimedia.org https://images.sephora.com https://www.sephora.com https://static.zara.net https://*.supabase.co https://media.neimanmarcus.com https://tomford.com https://louisvuitton.com https://armaf.com https://xerjoff.com https://target.scene7.com https://vercel.live https://raw.githubusercontent.com https://i.imgur.com https://imgur.com",
    "font-src 'self' data:",
    `connect-src 'self' https://${cspHost} https://*.supabase.co wss://${cspHost} https://vercel.live`,
    "frame-src 'self' https://vercel.live",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml)$).*)',
  ],
}
