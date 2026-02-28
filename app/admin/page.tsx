'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LayoutTemplate, Globe, LogOut, User, Plus, Upload } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ templates: 0, websites: 0 });
    const [userEmail, setUserEmail] = useState('');
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserEmail(user.email || '');

            const { data: templates } = await supabase.from('templates').select('id');
            const { data: websites } = await supabase.from('pages').select('id').not('owner_id', 'is', null) // Only show tenants with an owner;

            setStats({
                templates: templates?.length || 0,
                websites: websites?.length || 0,
            });
        };

        fetchData();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-background text-white">
            {/* Header */}
            <header className="bg-surface border-b border-white/10 p-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-heading font-bold">Admin Dashboard</h1>
                        <p className="text-gray-400 text-sm mt-1">Manage templates & websites</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {userEmail && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 px-4 py-2 rounded-lg">
                                <User className="w-4 h-4" />
                                {userEmail}
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6">
                {/* Stats */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-surface border border-white/10 rounded-2xl p-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 bg-primary/20 rounded-xl">
                                <LayoutTemplate className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Templates</p>
                                <p className="text-4xl font-bold">{stats.templates}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-white/10 rounded-2xl p-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 bg-blue-500/20 rounded-xl">
                                <Globe className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Tenants</p>
                                <p className="text-4xl font-bold">{stats.websites}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Link
                        href="/admin/templates"
                        className="bg-surface border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors group"
                    >
                        <LayoutTemplate className="w-12 h-12 text-primary mb-4" />
                        <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                            Manage Templates
                        </h2>
                        <p className="text-gray-400">Create, edit, and delete website templates</p>
                    </Link>

                    <Link
                        href="/admin/tenants"
                        className="bg-surface border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors group"
                    >
                        <Globe className="w-12 h-12 text-blue-400 mb-4" />
                        <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                            Manage Tenants
                        </h2>
                        <p className="text-gray-400">Create and manage rental owners</p>
                    </Link>
                </div>

                {/* Quick Action */}
                <div className="mt-8 flex gap-4">
                    <Link
                        href="/admin/tenants/create"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all hover:glow-box"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Tenant
                    </Link>
                    <Link
                        href="/admin/onboarding"
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl transition-all"
                    >
                        <Upload className="w-5 h-5" />
                        Bulk Onboarding
                    </Link>
                </div>
            </main>
        </div>
    );
}
