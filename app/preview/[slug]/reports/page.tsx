import { getPreviewPageData } from '@/lib/preview/getPreviewData';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PreviewReportsClient from './PreviewReportsClient';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function PreviewReportsPage({ params }: PageProps) {
    const { slug } = await params;
    const data = await getPreviewPageData(slug);
    if (!data) redirect('/');

    const supabase = await createClient();

    const { data: sessions } = await supabase
        .from('sessions')
        .select('*, stations(name)')
        .eq('page_id', data.pageId)
        .eq('status', 'completed')
        .order('end_time', { ascending: false });

    return <PreviewReportsClient sessions={sessions || []} businessName={data.page.business_name} />;
}
