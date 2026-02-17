'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Globe, ArrowLeft, Plus, ExternalLink, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

export default function WebsitesPage() {
    const [websites, setWebsites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchWebsites();
    }, []);

    const fetchWebsites = async () => {
        const { data } = await supabase
            .from('pages')
            .select('*, templates(name)')
            .not('owner_id', 'is', null) // Only show tenants with an owner
            .order('created_at', { ascending: false });
        setWebsites(data || []);
        setLoading(false);
    };

    const handleDelete = async (id: string, slug: string) => {
        if (!confirm(`Hapus website "${slug}"?`)) return;

        const { error } = await supabase.from('pages').delete().eq('id', id);
        if (error) {
            alert('Gagal menghapus website');
        } else {
            fetchWebsites();
        }
    };

    return (
        <div className="min-h-screen bg-background text-white p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-heading font-bold">Tenants</h1>
                            <p className="text-gray-400 text-sm">Manage rental owners</p>
                        </div>
                    </div>
                    <Link
                        href="/admin/tenants/create"
                        className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Create Tenant
                    </Link>
                </div>

                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : websites.length === 0 ? (
                    <div className="text-center py-16">
                        <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Belum ada tenant yang dibuat</p>
                        <Link
                            href="/admin/tenants/create"
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Tenant
                        </Link>
                    </div>
                ) : (
                    <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="text-left p-4 font-bold text-sm uppercase text-gray-400">Business Name</th>
                                    <th className="text-left p-4 font-bold text-sm uppercase text-gray-400">Slug</th>
                                    <th className="text-left p-4 font-bold text-sm uppercase text-gray-400">Template</th>
                                    <th className="text-left p-4 font-bold text-sm uppercase text-gray-400">Created</th>
                                    <th className="text-right p-4 font-bold text-sm uppercase text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {websites.map((site) => (
                                    <tr key={site.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {site.logo_url && (
                                                    <img src={site.logo_url} alt={site.business_name} className="w-8 h-8 object-contain rounded" />
                                                )}
                                                <span className="font-bold">{site.business_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400 font-mono text-sm">/{site.slug}</td>
                                        <td className="p-4">
                                            <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
                                                {site.templates?.name || 'No Template'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {new Date(site.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={`/${site.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                                                    title="View Live"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                                <Link
                                                    href={`/builder?id=${site.id}`}
                                                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-500/10"
                                                    title="Edit Website (Builder)"
                                                >
                                                    <Globe className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/tenants/${site.id}/edit`}
                                                    className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors rounded-lg hover:bg-yellow-500/10"
                                                    title="Edit Tenant Info"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(site.id, site.slug)}
                                                    className="p-2 text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-500/10"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
