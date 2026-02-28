import { getPreviewPageData } from '@/lib/preview/getPreviewData';
import { redirect } from 'next/navigation';
import { DollarSign, Gamepad2 } from 'lucide-react';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function PreviewSettingsPage({ params }: PageProps) {
    const { slug } = await params;
    const data = await getPreviewPageData(slug);
    if (!data) redirect('/');

    const rawRates = data.page.rental_rates || {};
    const rates: Record<string, any> = {};
    Object.keys(rawRates).forEach((key) => {
        const current = rawRates[key];
        if (typeof current === 'number') {
            rates[key] = { hourly: current, halfDay: 0, daily: 0 };
        } else if (current && typeof current === 'object') {
            rates[key] = {
                hourly: current.hourly || 0,
                halfDay: current.halfDay || 0,
                daily: current.daily || 0,
            };
        }
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

    const rateEntries = Object.entries(rates);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold">Settings</h1>
                <p className="text-gray-400">Console types and rental rates</p>
            </div>

            <div className="bg-surface border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Rental Rates
                </h2>

                {rateEntries.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No console types configured yet</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {rateEntries.map(([type, config]) => (
                            <div key={type} className="bg-white/5 border border-white/10 rounded-xl p-5">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Gamepad2 className="w-5 h-5 text-primary" />
                                    {type}
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Per Jam (Hourly)</p>
                                        <p className="text-lg font-bold text-primary">{formatCurrency(config.hourly)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Half-Day (12 jam)</p>
                                        <p className="text-lg font-bold">{formatCurrency(config.halfDay)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Harian (Daily)</p>
                                        <p className="text-lg font-bold">{formatCurrency(config.daily)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* No Save / Add / Delete buttons in preview */}
            </div>
        </div>
    );
}
