import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getSiteDeploymentStatus(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'deploy_site')
      .single();
    
    if (error) {
      console.error('Error fetching site config:', error);
      return false; // Default to coming soon if there's an error
    }
    
    return data?.value || false;
  } catch (error) {
    console.error('Error in getSiteDeploymentStatus:', error);
    return false; // Default to coming soon
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Always allow API routes, Next.js internal routes, and static assets
  if (
    pathname.startsWith('/api/') || 
    pathname.startsWith('/_next/') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|mp4|webm|ogg)$/i)
  ) {
    return NextResponse.next();
  }

  // Get site deployment status from database
  const isDeployed = await getSiteDeploymentStatus();
  
  // If site is not deployed, redirect everything to ComingSoon except ComingSoon itself
  if (!isDeployed) {
    // Allow ComingSoon page and its assets
    if (pathname === '/ComingSoon' || pathname.startsWith('/ComingSoon/') ||
        // Allow login and admin paths
        pathname === '/login' || pathname.startsWith('/login/') ||
        pathname === '/admin' || pathname.startsWith('/admin/') ||
        pathname === '/api/auth' || pathname.startsWith('/api/auth/') ||
        pathname === '/api/site-config' || pathname.startsWith('/api/site-config/')) {
      return NextResponse.next();
    }
    
    // Allow specific paths that should work during coming soon
    if (pathname.startsWith('/contact/') || pathname.startsWith('/services/') || 
        pathname.startsWith('/download_the_app/') || pathname.startsWith('/home/') ||
        pathname.startsWith('/about/') || pathname.startsWith('/images/') ||
        pathname.startsWith('/portfolio/') || pathname.startsWith('/work_with_us/') ||
        pathname.startsWith('/app/') || pathname.startsWith('/us_vs_them/') ||
        pathname.startsWith('/faq/') || pathname.startsWith('/why_choose_us/') ||
        pathname.startsWith('/not_found/') || pathname.startsWith('/img/')) {
      return NextResponse.next();
    }
    
    // Redirect all other paths to ComingSoon
    return NextResponse.redirect(new URL('/ComingSoon', request.url));
  }

  // Only check authentication for admin routes
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request });
    
    // If there's no token and not already on login page, redirect to login
    if (!token && !pathname.startsWith('/login')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin role
    if (token && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // If we're on /admin exactly and authenticated, redirect to overview
    if (pathname === '/admin' && token) {
      return NextResponse.redirect(new URL('/admin/overview', request.url));
    }
  }

  // Allow all other routes without authentication
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/admin/:path*'
  ],
};