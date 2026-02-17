import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Get user session
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Public routes that don't need protection
    if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/api/')) {
        return supabaseResponse
    }

    const role = user?.user_metadata?.role as number | undefined

    // Protect /builder route
    if (request.nextUrl.pathname.startsWith('/builder') && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Protect /admin routes (Role 1 Only)
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (role !== 1) {
            // If logged in but not admin, redirect to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Protect /dashboard routes (Role 2 Only - or Role 1 can view too?)
    // Let's assume Role 1 can view everything, Role 2 only dashboard
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        // Optional: If Role 1 wants to view dashboard, we allow it.
        // If Role is missing, we default to dashboard or login?
    }

    // Default redirect for logged-in users hitting /login
    if (request.nextUrl.pathname === '/login' && user) {
        if (role === 1) {
            return NextResponse.redirect(new URL('/admin', request.url))
        } else {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
