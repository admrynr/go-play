'use client';

import { useState, useEffect } from 'react';
import StoryBrandTemplate from '@/components/templates/StoryBrandTemplate';
import { Save, Loader2, ExternalLink, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const PRESET_COLORS = [
    { name: 'PlayStation Blue', value: '#003791' },
    { name: 'Red', value: '#DC2626' },
    { name: 'Green', value: '#16A34A' },
    { name: 'Purple', value: '#9333EA' },
    { name: 'Orange', value: '#EA580C' },
    { name: 'Gold', value: '#CA8A04' },
];

export default function BuilderPage() {
    const [formData, setFormData] = useState({
        businessName: 'GO-PLAY',
        whatsappNumber: '6281234567890',
        address: 'Jalan Gaming No. 1, Jakarta Selatan',
        logoText: 'GO-PLAY',
        themeColor: '#003791',
    });

    const [isPublishing, setIsPublishing] = useState(false);
    const [publishResult, setPublishResult] = useState<{ slug: string } | null>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || '');
            }

            // Check for 'id' param in URL (for Admin override)
            const params = new URLSearchParams(window.location.search);
            const adminOverrideId = params.get('id');

            let query = supabase.from('pages').select('*');

            if (adminOverrideId) {
                // If ID is provided, fetch that specific page (RLS must allow or user must be admin)
                // Note: Standard client might still be blocked by RLS if not owner.
                // However, for now we assume Admin has RLS bypass or policy allows read.
                query = query.eq('id', adminOverrideId);
            } else if (user) {
                // Otherwise fetch user's own page
                query = query.eq('owner_id', user.id);
            } else {
                return;
            }

            const { data, error } = await query.single();

            if (data) {
                setFormData({
                    businessName: data.business_name || '',
                    whatsappNumber: data.whatsapp_number || '',
                    address: data.address || '',
                    logoText: data.logo_text || '',
                    themeColor: data.theme_color || '#003791',
                });
            }
        };
        init();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const response = await fetch('/api/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                setPublishResult({ slug: data.slug });
            } else {
                alert('Failed to publish page');
            }
        } catch (error) {
            console.error('Error publishing:', error);
            alert('Error publishing page');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background text-white">
            {/* Sidebar Editor */}
            <div className="w-full md:w-[400px] flex-shrink-0 bg-surface border-r border-white/10 flex flex-col h-[50vh] md:h-full overflow-y-auto custom-scrollbar z-20 shadow-2xl">
                <div className="p-6 border-b border-white/10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-heading font-bold mb-2">Page Builder</h1>
                            <p className="text-sm text-gray-400">Customize your rental landing page.</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                    {userEmail && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 px-3 py-2 rounded-lg">
                            <User className="w-3 h-3" />
                            {userEmail}
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-6 flex-grow">
                    {/* Business Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Informasi Bisnis</h3>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Nama Bisnis</label>
                            <input
                                type="text"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-white/10 rounded-lg p-3 text-sm focus:border-primary focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Nomor WhatsApp (62...)</label>
                            <input
                                type="text"
                                name="whatsappNumber"
                                value={formData.whatsappNumber}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-white/10 rounded-lg p-3 text-sm focus:border-primary focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Alamat</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full bg-background border border-white/10 rounded-lg p-3 text-sm focus:border-primary focus:outline-none transition-colors resize-none"
                            />
                        </div>
                    </div>

                    {/* Theme */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Tampilan & Warna</h3>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Pilih Warna Kostum</label>
                            <div className="grid grid-cols-6 gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setFormData(prev => ({ ...prev, themeColor: color.value }))}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${formData.themeColor === color.value ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-gray-500">Custom:</span>
                                <input
                                    type="color"
                                    name="themeColor"
                                    value={formData.themeColor}
                                    onChange={handleInputChange}
                                    className="w-8 h-8 rounded bg-transparent cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-surface sticky bottom-0 z-10">
                    <AnimatePresence mode="wait">
                        {publishResult ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-green-500 font-bold text-sm">Published Successfully!</span>
                                    <button onClick={() => setPublishResult(null)} className="text-gray-400 hover:text-white"><ExternalLink className="w-4 h-4" /></button>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        readOnly
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${publishResult.slug}`}
                                        className="bg-background text-xs p-2 rounded flex-grow text-gray-300 font-mono"
                                    />
                                    <a
                                        href={`/${publishResult.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded flex items-center justify-center transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </motion.div>
                        ) : (
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:glow-box disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Publish Website
                            </button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-grow h-[50vh] md:h-full overflow-y-auto bg-black relative">
                <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs text-white">
                    Live Preview
                </div>
                {/* We wrap the LandingPage in a div that scales closer to typical view if needed, 
            but for now we just render it full sceren in this pane */}
                <div className="origin-top-left transform scale-[0.8] md:scale-100 w-[125%] md:w-full h-full">
                    {/* Scale trick for mobile view simulation if needed, but simplistic is better */}
                    <StoryBrandTemplate {...formData} />
                </div>
            </div>
        </div>
    );
}
