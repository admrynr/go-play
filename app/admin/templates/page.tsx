'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LayoutTemplate, ArrowLeft, Eye, X, Palette, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_COLORS: Record<string, string> = {
    PlayZoneTemplate: '#9333EA',
    StoryBrandTemplate: '#003791',
};

interface Template {
    id: string;
    name: string;
    description: string;
    component_name: string;
    is_active: boolean;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
    const [previewColor, setPreviewColor] = useState('#003791');
    const supabase = createClient();

    useEffect(() => {
        fetchTemplates();
    }, []);

    // Close modal on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPreviewTemplate(null);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const fetchTemplates = async () => {
        const { data } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
        setTemplates(data || []);
        setLoading(false);
    };

    const openPreview = useCallback((template: Template) => {
        setPreviewColor(DEFAULT_COLORS[template.component_name] ?? '#003791');
        setPreviewTemplate(template);
    }, []);

    // Build iframe src: strip '#' from color for URL safety
    const iframeSrc = previewTemplate
        ? `/preview-template/${previewTemplate.component_name}?color=${previewColor.replace('#', '')}`
        : '';

    return (
        <div className="min-h-screen bg-background text-white p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-heading font-bold">Templates</h1>
                        <p className="text-gray-400 text-sm">Manage website templates</p>
                    </div>
                </div>

                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="bg-surface border border-white/10 rounded-2xl p-6 hover:bg-white/5 transition-colors flex flex-col gap-4"
                            >
                                <LayoutTemplate className="w-10 h-10 text-primary" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-1">{template.name}</h3>
                                    <p className="text-gray-400 text-sm">{template.description}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
                                        {template.component_name}
                                    </span>
                                    {template.is_active && (
                                        <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => openPreview(template)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 transition-colors text-sm font-semibold"
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview Template
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8 p-6 bg-surface border border-white/10 rounded-xl">
                    <p className="text-gray-400 text-sm">
                        <strong>Note:</strong> Template CRUD akan dikembangkan lebih lanjut. Untuk sekarang, gunakan template yang sudah tersedia.
                    </p>
                </div>
            </div>

            {/* ─── Preview Modal ─── */}
            {previewTemplate && (
                <div className="fixed inset-0 z-50 flex flex-col">
                    {/* Toolbar */}
                    <div className="flex items-center gap-4 px-5 py-3 bg-[#111] border-b border-white/10 shrink-0">
                        {/* macOS-style dots */}
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setPreviewTemplate(null)}
                                className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                                title="Close"
                            />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                            <div className="w-3 h-3 rounded-full bg-green-500/60" />
                        </div>

                        {/* Template name */}
                        <div className="flex-1 text-center">
                            <span className="text-sm font-semibold text-white">{previewTemplate.name}</span>
                            <span className="text-xs text-gray-500 ml-2">— Preview Mode</span>
                        </div>

                        {/* Color picker */}
                        <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4 text-gray-400" />
                            <label className="flex items-center gap-2 cursor-pointer" title="Ganti warna tema">
                                <div
                                    className="w-7 h-7 rounded-lg border-2 border-white/20 overflow-hidden shadow"
                                    style={{ background: previewColor }}
                                >
                                    <input
                                        type="color"
                                        value={previewColor}
                                        onChange={(e) => setPreviewColor(e.target.value)}
                                        className="opacity-0 w-full h-full cursor-pointer"
                                    />
                                </div>
                                <span className="text-xs text-gray-400 hidden sm:inline">{previewColor}</span>
                            </label>
                        </div>

                        {/* Open full tab */}
                        <a
                            href={iframeSrc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Buka di tab baru"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Close */}
                        <button
                            onClick={() => setPreviewTemplate(null)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Close (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* iframe — fills remaining height, full scroll inside */}
                    <iframe
                        key={iframeSrc}
                        src={iframeSrc}
                        className="flex-1 w-full border-0 bg-black"
                        title={`Preview: ${previewTemplate.name}`}
                    />
                </div>
            )}
        </div>
    );
}
