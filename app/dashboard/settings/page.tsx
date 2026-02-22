'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Loader2, DollarSign, Gamepad2, Plus, Trash2, AlertTriangle, Trophy } from 'lucide-react';

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

    // New Type State
    const [newType, setNewType] = useState('');
    const [showAddType, setShowAddType] = useState(false);

    // Loyalty Settings State
    const [loyaltyProgramActive, setLoyaltyProgramActive] = useState(false);
    const [loyaltyTargetHours, setLoyaltyTargetHours] = useState(10);

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

            // Fetch tenant info for loyalty settings
            const { data: tenant } = await supabase
                .from('tenants')
                .select('loyalty_program_active, loyalty_target_hours')
                .eq('user_id', user.id)
                .single();

            if (tenant) {
                setLoyaltyProgramActive(tenant.loyalty_program_active ?? false);
                // Convert stored minutes back to hours for display
                setLoyaltyTargetHours(tenant.loyalty_target_hours ? tenant.loyalty_target_hours / 60 : 10);
            }

            // Migrate old number format to object if necessary, or just load
            Object.keys(existingRates).forEach(key => {
                const current = existingRates[key];
                if (typeof current === 'number') {
                    initialRates[key] = { hourly: current, halfDay: 0, daily: 0 };
                } else if (current && typeof current === 'object') {
                    initialRates[key] = {
                        hourly: current.hourly || 0,
                        halfDay: current.halfDay || 0,
                        daily: current.daily || 0
                    };
                }
            });

            // If empty, maybe default to standard types? 
            if (Object.keys(initialRates).length === 0) {
                ['PS5', 'PS4'].forEach(t => {
                    initialRates[t] = { hourly: 0, halfDay: 0, daily: 0 };
                });
            }

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

    const handleAddType = () => {
        if (!newType.trim()) return;
        if (rates[newType]) {
            alert('Type already exists');
            return;
        }
        setRates(prev => ({
            ...prev,
            [newType]: { hourly: 0, halfDay: 0, daily: 0 }
        }));
        setNewType('');
        setShowAddType(false);
    };

    const handleDeleteType = (type: string) => {
        if (!confirm(`Are you sure you want to delete "${type}"? This will affect stations using this type.`)) return;
        const newRates = { ...rates };
        delete newRates[type];
        setRates(newRates);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pageId) return;
        setSaving(true);
        console.log('Saving rates:', rates);

        const { error: pageError } = await supabase
            .from('pages')
            .update({ rental_rates: rates })
            .eq('id', pageId);

        // Update Tenant Settings
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error: tenantError } = await supabase
                .from('tenants')
                .update({
                    loyalty_program_active: loyaltyProgramActive,
                    loyalty_target_hours: loyaltyTargetHours * 60 // store as minutes
                })
                .eq('user_id', user.id);

            if (tenantError) {
                console.error('Tenant Save Error:', tenantError);
                alert(`Failed to update loyalty settings: ${tenantError.message}`);
                setSaving(false);
                return;
            }
        }

        if (pageError) {
            console.error('Save Error:', pageError);
            alert(`Failed to update settings: ${pageError.message}`);
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
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-400" />
                                    Pricing Configuration
                                </h2>
                                <p className="text-sm text-gray-400">
                                    Define your console types and their rates.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddType(true)}
                                className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Type
                            </button>
                        </div>

                        {/* Add Type Input */}
                        {showAddType && (
                            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 animate-in slide-in-from-top-2">
                                <label className="block text-sm font-bold mb-2">New Console Type Name</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="e.g. VIP Room, Racing Sim"
                                        className="flex-grow bg-background border border-white/10 rounded-lg px-4 py-2 focus:border-primary focus:outline-none"
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddType}
                                        disabled={!newType.trim()}
                                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddType(false)}
                                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 px-4">
                                <div className="col-span-3">Console Type</div>
                                <div className="col-span-3 text-right">Hourly (On-Site)</div>
                                <div className="col-span-3 text-right">Half Day (12h)</div>
                                <div className="col-span-3 text-right">Full Day (24h)</div>
                            </div>

                            {Object.keys(rates).length === 0 && (
                                <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl border-2 border-dashed border-white/5">
                                    No console types defined. Click "Add Type" to start.
                                </div>
                            )}

                            {Object.keys(rates).map(type => (
                                <div key={type} className="grid grid-cols-12 gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5 group relative">

                                    {/* Delete Button (hover) */}
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteType(type)}
                                        className="absolute -left-3 top-1/2 -translate-y-1/2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                        title="Delete Type"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>

                                    <div className="col-span-3 flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                            <Gamepad2 className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-white truncate" title={type}>{type}</span>
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

                    {/* Loyalty Settings */}
                    <div className="pt-8 border-t border-white/10">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-400" />
                                Loyalty Program
                            </h2>
                            <p className="text-sm text-gray-400">
                                Configure automatic loyalty rewards for your players.
                            </p>
                        </div>

                        <div className="space-y-6 bg-white/5 p-6 rounded-xl border border-white/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-white">Enable Loyalty Program</h3>
                                    <p className="text-sm text-gray-400">Toggle automatic point calculation and rewards.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={loyaltyProgramActive}
                                        onChange={(e) => setLoyaltyProgramActive(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {loyaltyProgramActive && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                                    <label className="block text-sm font-bold text-white">Target Jam Bermain</label>
                                    <p className="text-xs text-gray-400 mb-2">
                                        Pemain akan mendapatkan voucher gratis 1 jam setelah bermain selama total jam yang ditentukan.
                                        (Nilai poin dihitung 1000 per 1 jam).
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            className="w-24 bg-background border border-white/10 rounded-lg py-2 px-4 text-center text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            value={loyaltyTargetHours}
                                            onChange={(e) => setLoyaltyTargetHours(parseInt(e.target.value) || 10)}
                                        />
                                        <span className="text-gray-400">Jam = Target {(loyaltyTargetHours * 1000).toLocaleString()} Poin</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all hover:glow-box disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
