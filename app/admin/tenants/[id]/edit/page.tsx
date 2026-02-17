'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';

const THEME_COLORS = [
    '#003791', '#E60012', '#107C10', '#6F2DA8', '#FF9900', '#000000',
];

export default function EditTenantPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        businessName: '',
        whatsappNumber: '',
        address: '',
        logoUrl: '',
        themeColor: '#003791',
        templateId: '',
        slug: '',
    });

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch Templates
            const { data: tmpl } = await supabase.from('templates').select('*').eq('is_active', true);
            setTemplates(tmpl || []);

            // Fetch Page Data
            const { data: page, error } = await supabase
                .from('pages')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (page) {
                setFormData({
                    businessName: page.business_name || '',
                    whatsappNumber: page.whatsapp_number || '',
                    address: page.address || '',
                    logoUrl: page.logo_url || '',
                    themeColor: page.theme_color || '#003791',
                    templateId: page.template_id || '',
                    slug: page.slug || '',
                });
            }
        } catch (err) {
            console.error(err);
            alert('Failed to load tenant data');
            router.push('/admin/tenants');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('pages')
                .update({
                    business_name: formData.businessName,
                    whatsapp_number: formData.whatsappNumber,
                    address: formData.address,
                    logo_url: formData.logoUrl,
                    theme_color: formData.themeColor,
                    template_id: formData.templateId,
                    // Slug edits can be dangerous, verify if needed. specific logic for slug might be needed.
                })
                .eq('id', id);

            if (error) throw error;

            alert('Tenant updated successfully!');
            router.push('/admin/tenants');
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center p-6">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin/tenants" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
                        <p className="text-sm text-gray-500">Update business information</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b pb-2">Business Profile</h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                                    value={formData.whatsappNumber}
                                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                />
                            </div>
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
                    </div>

                    {/* Branding */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b pb-2 mt-6">Branding & Template</h3>

                        <div className="grid md:grid-cols-2 gap-6">
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

                                <div className="mt-4">
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
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                                <ImageUpload
                                    bucket="logos"
                                    existingUrl={formData.logoUrl}
                                    onUpload={(url) => setFormData({ ...formData, logoUrl: url })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 flex gap-4">
                        <Link
                            href="/admin/tenants"
                            className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
                                <Save className="w-5 h-5" />
                                Save Changes
                            </>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
