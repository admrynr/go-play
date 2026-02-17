import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: Create OR Update page (upsert logic)
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { businessName, whatsappNumber, address, logoText, logoUrl, themeColor, templateId, targetPageId } = body;

        let targetPage = null;
        let targetTenant = null;

        if (targetPageId) {
            // ADMIN OR OWNER check
            const { data: pageById, error: fetchPageError } = await supabase
                .from('pages')
                .select('*, tenants(*)')
                .eq('id', targetPageId)
                .single();

            if (fetchPageError || !pageById) {
                return NextResponse.json({ success: false, error: 'Target page not found' }, { status: 404 });
            }

            // Permissions: is owner OR is admin
            const isOwner = pageById.owner_id === user.id;
            const isAdmin = user.user_metadata?.role === 1;

            if (!isOwner && !isAdmin) {
                return NextResponse.json({ success: false, error: 'Unauthorized to edit this page' }, { status: 403 });
            }

            targetPage = pageById;
            targetTenant = pageById.tenants;
        } else {
            // FALLBACK: find by current user's tenant
            const { data: tenant } = await supabase
                .from('tenants')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!tenant) {
                return NextResponse.json({ success: false, error: 'Tenant profile not found' }, { status: 404 });
            }

            targetTenant = tenant;

            const { data: pageByTenant } = await supabase
                .from('pages')
                .select('*')
                .eq('tenant_id', tenant.id)
                .single();

            targetPage = pageByTenant;
        }

        if (targetPage) {
            // UPDATE existing page - always keep slug synced with tenant username
            const { data, error } = await supabase
                .from('pages')
                .update({
                    slug: targetTenant.username,
                    business_name: businessName || targetTenant.business_name,
                    whatsapp_number: whatsappNumber || '',
                    address: address || '',
                    logo_text: logoText || businessName || targetTenant.business_name,
                    logo_url: logoUrl || null,
                    theme_color: themeColor || '#003791',
                    template_id: templateId || targetPage.template_id,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', targetPage.id)
                .select()
                .single();

            if (error) throw error;

            // SYNC back to tenants table if business name changed
            if (businessName && businessName !== targetTenant.business_name) {
                await supabase
                    .from('tenants')
                    .update({ business_name: businessName })
                    .eq('id', targetTenant.id);
            }

            return NextResponse.json({ success: true, slug: data.slug, page: data });
        }

        // Create new page if somehow not existing (default fallback)
        const { data: newPage, error: insertError } = await supabase
            .from('pages')
            .insert({
                owner_id: user.id,
                tenant_id: targetTenant.id,
                slug: targetTenant.username,
                business_name: businessName || targetTenant.business_name,
                whatsapp_number: whatsappNumber || '',
                address: address || '',
                logo_text: logoText || businessName || targetTenant.business_name,
                logo_url: logoUrl || null,
                theme_color: themeColor || '#003791',
                template_id: templateId || null,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // SYNC back to tenants table for new pages too
        if (businessName) {
            await supabase
                .from('tenants')
                .update({ business_name: businessName })
                .eq('id', targetTenant.id);
        }

        return NextResponse.json({ success: true, slug: newPage.slug, page: newPage });
    } catch (error: any) {
        console.error('Builder API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
