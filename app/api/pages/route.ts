import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: Create a new page
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { businessName, whatsappNumber, address, logoText, themeColor } = body;

        // Generate a simple slug from business name
        let slug = businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        if (!slug) {
            slug = `biz-${Math.random().toString(36).substring(7)}`;
        }

        // Check if slug exists and make it unique
        let uniqueSlug = slug;
        let counter = 1;

        while (true) {
            const { data: existing } = await supabase
                .from('pages')
                .select('slug')
                .eq('slug', uniqueSlug)
                .single();

            if (!existing) break;
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }

        // Insert new page
        const { data, error } = await supabase
            .from('pages')
            .insert({
                slug: uniqueSlug,
                business_name: businessName,
                whatsapp_number: whatsappNumber,
                address,
                logo_text: logoText || businessName,
                theme_color: themeColor || '#003791',
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, slug: data.slug, page: data });
    } catch (error) {
        console.error('Error creating page:', error);
        return NextResponse.json({ success: false, error: 'Failed to create page' }, { status: 500 });
    }
}

// GET: Get page by slug or all pages
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (slug) {
            const { data, error } = await supabase
                .from('pages')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error || !data) {
                return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, page: data });
        }

        // Return all pages
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, pages: data });
    } catch (error) {
        console.error('Error fetching pages:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch pages' }, { status: 500 });
    }
}
