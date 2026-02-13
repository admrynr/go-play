'use client';

import { useState, useEffect } from 'react';
import StoryBrandTemplate from '@/components/templates/StoryBrandTemplate';
import { Save, Loader2, ExternalLink, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';

const PRESET_COLORS = [
    { name: 'PlayStation Blue', value: '#003791' },
    { name: 'Fire Red', value: '#DC2626' },
    { name: 'Nature Green', value: '#16A34A' },
    { name: 'Royal Purple', value: '#7C3AED' },
    { name: 'Sunset Orange', value: '#EA580C' },
];

export default function CreateWebsitePage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [formData, setFormData] = useState({
        businessName: 'GO-PLAY',
        whatsappNumber: '6281234567890',
        address: 'Jalan Gaming No. 1, Jakarta Selatan',
        logoText: 'GO-PLAY',
        logoUrl: '',
        themeColor: '#003791',
    });

    const [isPublishing, setIsPublishing] = useState(false);
    const [publishResult, setPublishResult] = useState<{ slug: string } | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        const { data } = await supabase.from('templates').select('*').eq('is_active', true);
        if (data && data.length > 0) {
            setTemplates(data);
            setSelectedTemplateId(data[0].id);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const response = await fetch('/api/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    templateId: selectedTemplateId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setPublishResult({ slug: data.slug });
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to publish website');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background">
            {/* Sidebar Editor */}
            <div className="w-full md:w-[420px] flex-shrink-0 bg-surface border-r border-white/10 flex flex-col h-[50vh] md:h-full overflow-y-auto custom-scrollbar z-20 shadow-2xl">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/admin/websites" className="text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-heading font-bold">Create Website</h1>
                            <p className="text-sm text-gray-400">Customize and publish</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6 flex-grow">
                    {/* Template Selector */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Template</label>
                        <select
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                        >
                            {templates.map((template) => (
                                <option key={template.id} value={template.id}>
                                    {template.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Business Name */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Business Name</label>
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleInputChange}
                            className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                        />
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Business Logo (Optional)</label>
                        <ImageUpload
                            currentImage={formData.logoUrl}
                            onUpload={(url) => setFormData((prev) => ({ ...prev, logoUrl: url }))}
                        />
                    </div>

                    {/* WhatsApp */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">WhatsApp Number</label>
                        <input
                            type="text"
                            name="whatsappNumber"
                            value={formData.whatsappNumber}
                            onChange={handleInputChange}
                            placeholder="628123456789"
                            className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none resize-none"
                        />
                    </div>

                    {/* Theme Color */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Theme Color</label>
                        <div className="flex gap-2 mb-3">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => setFormData((prev) => ({ ...prev, themeColor: color.value }))}
                                    className={`w-10 h-10 rounded-lg border-2 ${formData.themeColor === color.value ? 'border-white' : 'border-transparent'
                                        } hover:scale-110 transition-transform`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                        <input
                            type="color"
                            name="themeColor"
                            value={formData.themeColor}
                            onChange={handleInputChange}
                            className="w-full h-12 rounded-lg cursor-pointer"
                        />
                    </div>
                </div>

                {/* Publish Button */}
                <div className="p-6 border-t border-white/10">
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all hover:glow-box disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Publishing...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Publish Website
                            </>
                        )}
                    </button>

                    {/* Success Message */}
                    <AnimatePresence>
                        {publishResult && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                            >
                                <p className="text-green-400 text-sm mb-2">✅ Website published!</p>
                                <a
                                    href={`/${publishResult.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary text-sm flex items-center gap-1 hover:underline"
                                >
                                    /{publishResult.slug} <ExternalLink className="w-4 h-4" />
                                </a>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-grow overflow-y-auto bg-background relative">
                <div className="absolute top-4 right-4 z-10 bg-surface px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-400">
                    Live Preview
                </div>
                <div className="origin-top-left transform scale-[0.8] md:scale-100 w-[125%] md:w-full h-full">
                    <StoryBrandTemplate {...formData} />
                </div>
            </div>
        </div>
    );
}
