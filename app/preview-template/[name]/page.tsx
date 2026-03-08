import PlayZoneTemplate from '@/components/templates/PlayZoneTemplate';
import StoryBrandTemplate from '@/components/templates/StoryBrandTemplate';

const SAMPLE_PROPS = {
    businessName: 'Rental PS Contoh',
    whatsappNumber: '6281234567890',
    address: 'Jl. Gaming No. 1, Jakarta Selatan',
    logoText: 'GO-PLAY',
    operationalHours: 'Senin – Minggu: 10:00 – 23:00',
    loyaltyProgramActive: true,
    loyaltyTargetHours: 10,
    isBuilderMode: false,
};

interface Props {
    params: Promise<{ name: string }>;
    searchParams: Promise<{ color?: string }>;
}

export default async function PreviewTemplatePage({ params, searchParams }: Props) {
    const { name } = await params;
    const { color } = await searchParams;

    const themeColor = color ? `#${color}` : undefined;

    const TemplateComponent =
        name === 'PlayZoneTemplate' ? PlayZoneTemplate : StoryBrandTemplate;

    return (
        <TemplateComponent
            {...SAMPLE_PROPS}
            themeColor={themeColor ?? (name === 'PlayZoneTemplate' ? '#9333EA' : '#003791')}
        />
    );
}
