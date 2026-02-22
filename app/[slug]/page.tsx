import StoryBrandTemplate from '@/components/templates/StoryBrandTemplate';
import PlayZoneTemplate from '@/components/templates/PlayZoneTemplate';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function getPageData(slug: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('pages')
        .select('*, templates(component_name), tenants(loyalty_program_active, loyalty_target_hours)')
        .eq('slug', slug)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

export default async function DynamicPage({ params }: PageProps) {
    const { slug } = await params;
    const pageData = await getPageData(slug);

    if (!pageData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
                <h1 className="text-4xl font-bold mb-4 text-primary">404</h1>
                <p className="text-xl mb-8">Halaman Rental PS tidak ditemukan.</p>
                <p className="text-gray-500 text-sm">Mungkin link-nya salah atau sudah dihapus.</p>
                <a href="/" className="mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                    Kembali ke Beranda
                </a>
            </div>
        );
    }

    // Determine which template to use
    const templateName = pageData.templates?.component_name || 'StoryBrandTemplate';
    const TemplateComponent = templateName === 'PlayZoneTemplate' ? PlayZoneTemplate : StoryBrandTemplate;

    return (
        <TemplateComponent
            businessName={pageData.business_name}
            whatsappNumber={pageData.whatsapp_number}
            address={pageData.address}
            themeColor={pageData.theme_color}
            logoText={pageData.logo_text}
            logoUrl={pageData.logo_url}
            instagramLink={pageData.instagram_link}
            tiktokLink={pageData.tiktok_link}
            operationalHours={pageData.operational_hours}
            customConfig={pageData.custom_config}
        />
    );
}
