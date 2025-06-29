import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Debug function
function debugLog(message: string, data?: any) {
  console.log(`[Middleware Debug ${new Date().toISOString()}] ${message}`, data || '');
}

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

// List of public paths that should always be accessible
const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/ComingSoon',
  '/contact',
  '/services',
  '/download_the_app',
  '/home',
  '/about',
  '/images',
  '/portfolio',
  '/work_with_us',
  '/app',
  '/us_vs_them',
  '/faq',
  '/why_choose_us',
  '/not_found',
  '/img',
  '/register',
  '/forgot-password'
];

// Check if a path matches any of the public paths
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(publicPath => 
    pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );
}

// Check if a path is a static asset or internal route
function isStaticOrInternalPath(pathname: string): boolean {
  return (
    pathname.startsWith('/api/') || 
    pathname.startsWith('/_next/') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|mp4|webm|ogg|ttf|woff|woff2)$/i) !== null
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  debugLog('🔍 Processing request for path:', pathname);

  // Step 1: Always allow static assets and internal routes
  if (isStaticOrInternalPath(pathname)) {
    debugLog('✅ Allowing static/internal route:', pathname);
    return NextResponse.next();
  }

  // Step 2: Always allow public paths
  if (isPublicPath(pathname)) {
    debugLog('✅ Allowing public path:', pathname);
    return NextResponse.next();
  }

  // Step 3: Handle admin routes
  if (pathname.startsWith('/admin')) {
    debugLog('🔒 Checking admin authentication for path:', pathname);
    
    try {
      const token = await getToken({ req: request });
      debugLog('🎫 Auth token status:', { 
        exists: !!token,
        role: token?.role || 'no role',
        email: token?.email || 'no email'
      });
      
      if (!token) {
        debugLog('❌ No auth token found, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (token.role !== 'admin') {
        debugLog('⛔ User does not have admin role:', token.role);
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      debugLog('✅ Admin access granted');
      return NextResponse.next();
    } catch (error) {
      debugLog('🚨 Error during authentication:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Step 4: Check site deployment status for all other routes
  const isDeployed = await getSiteDeploymentStatus();
  debugLog('📡 Site deployment status:', { isDeployed });
  
  if (!isDeployed) {
    debugLog('🔄 Redirecting to ComingSoon page');
    return NextResponse.redirect(new URL('/ComingSoon', request.url));
  }

  debugLog('✅ Allowing access to deployed site');
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match only:
     * - /admin/* routes (for admin protection)
     * - /* routes (for deployment status check)
     * But exclude:
     * - /api/* (API routes)
     * - /_next/* (Next.js internals)
     * - /static/* (static files)
     * - /login (auth routes)
     * - /register (auth routes)
     * - /forgot-password (auth routes)
     */
    '/admin/:path*',
    '/((?!api|_next|static|login|register|forgot-password|favicon.ico).*)'
  ],
};