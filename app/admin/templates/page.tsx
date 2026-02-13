'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LayoutTemplate, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        const { data } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
        setTemplates(data || []);
        setLoading(false);
    };

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
                            <div key={template.id} className="bg-surface border border-white/10 rounded-2xl p-6 hover:bg-white/5 transition-colors">
                                <LayoutTemplate className="w-10 h-10 text-primary mb-4" />
                                <h3 className="text-xl font-bold mb-2">{template.name}</h3>
                                <p className="text-gray-400 text-sm mb-4">{template.description}</p>
                                <div className="flex gap-2">
                                    <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">{template.component_name}</span>
                                    {template.is_active && (
                                        <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">Active</span>
                                    )}
                                </div>
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
        </div>
    );
}
