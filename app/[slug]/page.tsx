import LandingPage from '@/components/LandingPage';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function getPageData(slug: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('pages')
        .select('*')
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

    return (
        <LandingPage
            businessName={pageData.business_name}
            whatsappNumber={pageData.whatsapp_number}
            address={pageData.address}
            themeColor={pageData.theme_color}
            logoText={pageData.logo_text}
        />
    );
}
