import { getPreviewPageData } from '@/lib/preview/getPreviewData';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UtensilsCrossed, Coffee, Pizza, Package } from 'lucide-react';

const CATEGORIES = [
    { id: 'food', name: 'Makanan (Food)', icon: '🍕' },
    { id: 'drink', name: 'Minuman (Drink)', icon: '☕' },
    { id: 'snack', name: 'Cemilan (Snack)', icon: '📦' },
    { id: 'packet', name: 'Paket Hemat', icon: '🍽️' },
];

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function PreviewMenuPage({ params }: PageProps) {
    const { slug } = await params;
    const data = await getPreviewPageData(slug);
    if (!data) redirect('/');

    const supabase = await createClient();

    const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('page_id', data.pageId)
        .order('category', { ascending: true });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

    const grouped = CATEGORIES.map((cat) => ({
        ...cat,
        items: (menuItems || []).filter((item) => item.category === cat.id),
    })).filter((cat) => cat.items.length > 0);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Menu & F&B</h1>
                    <p className="text-gray-400">Food and beverage menu items</p>
                </div>
                {/* No Add button in preview */}
            </div>

            {grouped.length === 0 ? (
                <div className="py-20 text-center text-gray-500 bg-surface/50 rounded-2xl border border-dashed border-white/10">
                    <p className="text-4xl mb-4">🍽️</p>
                    <h3 className="text-xl font-bold mb-2">No Menu Items Yet</h3>
                    <p>Menu items will appear here once configured</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {grouped.map((category) => (
                        <div key={category.id}>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span>{category.icon}</span> {category.name}
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {category.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-surface border border-white/10 rounded-2xl p-5 flex justify-between items-center"
                                    >
                                        <div>
                                            <h3 className="font-bold">{item.name}</h3>
                                            <p className="text-primary font-bold mt-1">{formatCurrency(item.price)}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${item.is_available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {item.is_available ? 'Available' : 'Unavailable'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
