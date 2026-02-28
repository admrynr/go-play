import { createClient } from '@/lib/supabase/server';

/**
 * Fetches tenant page data by slug for preview pages.
 * Returns pageId and page data, or null if not found/claimed.
 */
export async function getPreviewPageData(slug: string) {
    const supabase = await createClient();

    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('username', slug)
        .single();

    if (!tenant || tenant.is_claimed) return null;

    const { data: page } = await supabase
        .from('pages')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();

    if (!page) return null;

    return { tenant, page, pageId: page.id, supabase };
}
