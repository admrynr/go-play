'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Globe, ArrowLeft, Plus, ExternalLink, Trash2, Edit, X, Loader2, Mail, Lock, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WebsitesPage() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        businessName: '',
    });

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        const { data } = await supabase
            .from('tenants')
            .select('*, pages(id, slug, templates(name))')
            .order('created_at', { ascending: false });
        setTenants(data || []);
        setLoading(false);
    };

    const checkUsernameAvailability = async (val: string) => {
        if (val.length < 3) {
            setUsernameStatus('idle');
            return;
        }
        setUsernameStatus('checking');
        try {
            const res = await fetch(`/api/admin/users?check_username=${val}`);
            const data = await res.json();
            setUsernameStatus(data.available ? 'available' : 'taken');
        } catch (err) {
            setUsernameStatus('idle');
        }
    };

    const handleDelete = async (tenantId: string, username: string) => {
        if (!confirm(`Hapus tenant "${username}"? Ini akan menghapus website DAN akun login user tersebut.`)) return;

        try {
            const res = await fetch(`/api/admin/users?id=${tenantId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert('Tenant berhasil dihapus');
            fetchTenants();
        } catch (error: any) {
            alert('Gagal menghapus tenant: ' + error.message);
        }
    };

    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (usernameStatus !== 'available') {
            alert('Username tidak tersedia atau belum dicek');
            return;
        }
        setIsCreating(true);

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create tenant');
            }

            // Successfully created, redirect to builder for this page
            setIsModalOpen(false);
            router.push(`/builder?id=${data.page.id}`);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsCreating(false);
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
                            <p className="text-gray-400 text-sm">Manage rental owners and their websites</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ email: '', password: '', username: '', businessName: '' });
                            setUsernameStatus('idle');
                            setIsModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:glow-box"
                    >
                        <Plus className="w-5 h-5" />
                        Create Tenant
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : tenants.length === 0 ? (
                    <div className="text-center py-16 bg-surface border border-white/5 rounded-2xl">
                        <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Belum ada tenant yang dibuat</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Tenant
                        </button>
                    </div>
                ) : (
                    <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10 text-left">
                                <tr>
                                    <th className="p-4 font-bold text-xs uppercase text-gray-400 tracking-wider">Business Name</th>
                                    <th className="p-4 font-bold text-xs uppercase text-gray-400 tracking-wider">Username / Slug</th>
                                    <th className="p-4 font-bold text-xs uppercase text-gray-400 tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map((tenant) => {
                                    const page = tenant.pages?.[0]; // Assume 1 page per tenant
                                    return (
                                        <tr key={tenant.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center overflow-hidden">
                                                        <Globe className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <span className="font-bold">{tenant.business_name || 'New Rental'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-primary font-mono text-sm leading-none">
                                                <div className="flex flex-col gap-1">
                                                    <span>@{tenant.username}</span>
                                                    {page && <span className="text-[10px] text-gray-500">/{page.slug}</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {page && (
                                                        <>
                                                            <a
                                                                href={`/${page.slug}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                                                                title="View Live"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                            <Link
                                                                href={`/builder?id=${page.id}`}
                                                                className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-500/10"
                                                                title="Edit Website (Builder)"
                                                            >
                                                                <Globe className="w-4 h-4" />
                                                            </Link>
                                                        </>
                                                    )}
                                                    <Link
                                                        href={`/admin/tenants/${page?.id}/edit`} // Keep using page ID for edit routes if they exist
                                                        className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors rounded-lg hover:bg-yellow-500/10"
                                                        title="Edit Tenant Credentials"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(tenant.id, tenant.username)}
                                                        className="p-2 text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-500/10"
                                                        title="Delete Whole Tenant"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Tenant Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isCreating && setIsModalOpen(false)} />
                    <div className="relative bg-surface border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h2 className="text-xl font-heading font-bold">Create New Tenant</h2>
                            <button onClick={() => setIsModalOpen(false)} disabled={isCreating} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Business Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-background border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none transition-colors"
                                        placeholder="e.g. Lintang Gaming"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                        disabled={isCreating}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Username (URL Slug)</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        required
                                        className={`w-full bg-background border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none transition-colors ${usernameStatus === 'available' ? 'border-green-500' :
                                            usernameStatus === 'taken' ? 'border-red-500' : 'border-white/10'
                                            }`}
                                        placeholder="e.g. ps-rental-jaya"
                                        value={formData.username}
                                        onChange={(e) => {
                                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                            setFormData({ ...formData, username: val });
                                            checkUsernameAvailability(val);
                                        }}
                                        disabled={isCreating}
                                    />
                                    {usernameStatus === 'checking' && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
                                </div>
                                {usernameStatus === 'available' && <p className="text-[10px] text-green-500">Username tersedia!</p>}
                                {usernameStatus === 'taken' && <p className="text-[10px] text-red-500">Username sudah digunakan.</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-background border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none transition-colors"
                                        placeholder="owner@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={isCreating}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className="w-full bg-background border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none transition-colors"
                                        placeholder="Min. 6 characters"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        disabled={isCreating}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                <button
                                    type="submit"
                                    disabled={isCreating || usernameStatus !== 'available'}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:glow-box disabled:opacity-50"
                                >
                                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Create Tenant</>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isCreating}
                                    className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


