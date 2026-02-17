'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import StoryBrandTemplate from '@/components/templates/StoryBrandTemplate';
import ImageUpload from '@/components/ImageUpload';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Predefined colors
const THEME_COLORS = [
    '#003791', // PlayStation Blue
    '#E60012', // Nintendo Red
    '#107C10', // Xbox Green
    '#6F2DA8', // Twitch Purple
    '#FF9900', // Amazon Orange
    '#000000', // Black
];

export default function CreateWebsitePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        // User Info
        email: '',
        password: '',
        // Business Info
        businessName: '',
        whatsappNumber: '',
        address: 'Jalan Gaming No. 1, Jakarta',
        logoUrl: '',
        themeColor: '#003791',
        templateId: '',
    });

    const supabase = createClient();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        const { data } = await supabase.from('templates').select('*').eq('is_active', true);
        setTemplates(data || []);
        if (data && data.length > 0) {
            setFormData(prev => ({ ...prev, templateId: data[0].id }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            // Validate Step 1
            if (!formData.email || !formData.password || !formData.businessName) {
                alert('Please fill in all account details.');
                return;
            }
            setStep(2);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create tenant');
            }

            alert(`Tenant "${formData.businessName}" created successfully!`);
            router.push('/admin/tenants');
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Editor Panel (Left) */}
            <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto h-screen p-6">
                <div className="mb-6 flex items-center gap-2">
                    <Link href="/admin/tenants" className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create New Tenant</h1>
                        <div className="flex items-center gap-2 text-sm mt-1">
                            <span className={`px-2 py-0.5 rounded ${step === 1 ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500'}`}>1. Account</span>
                            <span className="text-gray-300">→</span>
                            <span className={`px-2 py-0.5 rounded ${step === 2 ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500'}`}>2. Builder</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* User Section */}
                            <section className="space-y-4 border-b pb-6">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">User Account</h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="owner@rentalyou.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Login email for the rental owner</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Min. 6 characters"
                                    />
                                </div>
                            </section>

                            {/* Basic Business Info */}
                            <section className="space-y-4">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Business Profile</h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="e.g. Go-Play Rental PS"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="e.g. 628123456789"
                                        value={formData.whatsappNumber}
                                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        required
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </section>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                            >
                                Next: Design Website →
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Visual Builder */}
                            <section className="space-y-4">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Design & Branding</h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={formData.templateId}
                                        onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                                    >
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                                    <ImageUpload
                                        bucket="logos"
                                        onUpload={(url) => setFormData({ ...formData, logoUrl: url })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {THEME_COLORS.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, themeColor: color })}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${formData.themeColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        type="color"
                                        className="w-full h-10 rounded cursor-pointer"
                                        value={formData.themeColor}
                                        onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                                    />
                                </div>
                            </section>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Tenant Account'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Preview Panel (Right) */}
            <div className="w-2/3 bg-gray-900 overflow-y-auto h-screen relative">
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs z-10">
                    Live Preview
                </div>
                <div className="scale-[0.8] origin-top">
                    <StoryBrandTemplate
                        businessName={formData.businessName || 'Business Name'}
                        whatsappNumber={formData.whatsappNumber}
                        address={formData.address}
                        themeColor={formData.themeColor}
                        logoText={formData.businessName}
                        logoUrl={formData.logoUrl}
                    />
                </div>
            </div>
        </div>
    );
}
