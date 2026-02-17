'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Loader2, DollarSign, Gamepad2, Clock, Calendar } from 'lucide-react';

const CONSOLE_TYPES = ['PS5', 'PS4', 'PS3', 'XBOX', 'PC'];

interface RateConfig {
    hourly: number;
    halfDay: number; // 12 Hours
    daily: number;   // 24 Hours
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pageId, setPageId] = useState<string | null>(null);
    const [rates, setRates] = useState<Record<string, RateConfig>>({});

    const supabase = createClient();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: page } = await supabase
            .from('pages')
            .select('id, rental_rates')
            .eq('owner_id', user.id)
            .single();

        if (page) {
            setPageId(page.id);
            // Parse existing rates or default
            const existingRates = page.rental_rates || {};
            const initialRates: Record<string, RateConfig> = {};

            CONSOLE_TYPES.forEach(type => {
                // Handle previous simple number format if exists, or new object format
                const current = existingRates[type];
                if (typeof current === 'number') {
                    initialRates[type] = { hourly: current, halfDay: 0, daily: 0 };
                } else if (current && typeof current === 'object') {
                    initialRates[type] = {
                        hourly: current.hourly || 0,
                        halfDay: current.halfDay || 0,
                        daily: current.daily || 0
                    };
                } else {
                    initialRates[type] = { hourly: 0, halfDay: 0, daily: 0 };
                }
            });

            setRates(initialRates);
        }
        setLoading(false);
    };

    const handleRateChange = (type: string, field: keyof RateConfig, value: string) => {
        setRates(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: parseFloat(value) || 0
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pageId) return;
        setSaving(true);

        console.log('Saving rates:', rates);
        const { error } = await supabase
            .from('pages')
            .update({ rental_rates: rates })
            .eq('id', pageId);

        if (error) {
            console.error('Save Error:', error);
            alert(`Failed to update settings: ${error.message}`);
        } else {
            alert('Settings saved successfully');
        }
        setSaving(false);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl">
            <h1 className="text-3xl font-heading font-bold mb-2">Settings</h1>
            <p className="text-gray-400 mb-8">Manage your rental configuration</p>

            <div className="bg-surface border border-white/10 rounded-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-400" />
                            Pricing Configuration
                        </h2>
                        <p className="text-sm text-gray-400 mb-6">
                            Set rates for On-Site (Hourly) and Off-Site Rentals (Half-Day/Daily).
                        </p>

                        <div className="space-y-4">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 px-4">
                                <div className="col-span-3">Console</div>
                                <div className="col-span-3 text-right">Hourly (On-Site)</div>
                                <div className="col-span-3 text-right">Half Day (12h)</div>
                                <div className="col-span-3 text-right">Full Day (24h)</div>
                            </div>

                            {CONSOLE_TYPES.map(type => (
                                <div key={type} className="grid grid-cols-12 gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="col-span-3 flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                            <Gamepad2 className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-white">{type}</span>
                                    </div>

                                    {/* Hourly */}
                                    <div className="col-span-3 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="500"
                                            className="w-full bg-background border border-white/10 rounded-lg py-2 pl-8 pr-2 text-right text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            value={rates[type]?.hourly ?? 0}
                                            onChange={(e) => handleRateChange(type, 'hourly', e.target.value)}
                                        />
                                    </div>

                                    {/* Half Day */}
                                    <div className="col-span-3 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="5000"
                                            className="w-full bg-background border border-white/10 rounded-lg py-2 pl-8 pr-2 text-right text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            value={rates[type]?.halfDay ?? 0}
                                            onChange={(e) => handleRateChange(type, 'halfDay', e.target.value)}
                                        />
                                    </div>

                                    {/* Daily */}
                                    <div className="col-span-3 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="5000"
                                            className="w-full bg-background border border-white/10 rounded-lg py-2 pl-8 pr-2 text-right text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            value={rates[type]?.daily ?? 0}
                                            onChange={(e) => handleRateChange(type, 'daily', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all hover:glow-box disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Pricing
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
