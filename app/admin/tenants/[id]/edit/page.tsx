'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Save, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';

export default function EditTenantPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pageInfo, setPageInfo] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'email' | 'password'>('email');
    const [emailForm, setEmailForm] = useState({ email: '', adminPassword: '' });
    const [passForm, setPassForm] = useState({ newPassword: '', confirmPassword: '', adminPassword: '' });

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: page, error } = await supabase
                .from('pages')
                .select('id, business_name, owner_id')
                .eq('id', id)
                .single();

            if (error) throw error;
            setPageInfo(page);

            if (page?.owner_id) {
                setUserId(page.owner_id);
                const res = await fetch(`/api/admin/users?id=${page.owner_id}`);
                const data = await res.json();
                if (data.user) {
                    setEmailForm(prev => ({ ...prev, email: data.user.email || '' }));
                }
            }
        } catch (err) {
            console.error(err);
            alert('Failed to load tenant data');
            router.push('/admin/tenants');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    email: emailForm.email,
                    adminPassword: emailForm.adminPassword
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            alert('Email updated successfully!');
            setEmailForm(prev => ({ ...prev, adminPassword: '' }));
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passForm.newPassword !== passForm.confirmPassword) {
            alert('Password konfirmasi tidak sesuai');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    password: passForm.newPassword,
                    adminPassword: passForm.adminPassword
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            alert('Password updated successfully!');
            setPassForm({ newPassword: '', confirmPassword: '', adminPassword: '' });
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center p-6">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin/tenants" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Credentials</h1>
                        <p className="text-sm text-gray-500">for <span className="font-bold text-blue-600">{pageInfo?.business_name}</span></p>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => setActiveTab('email')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'email' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Update Email
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'password' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Change Password
                    </button>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 mb-6 flex items-start gap-3">
                    <div className="mt-1"><Lock className="w-4 h-4" /></div>
                    <div>
                        <p className="font-bold">Super Admin Verification Required</p>
                        <p>To make changes to tenant credentials, you must verify your identity by entering <b>YOUR</b> Super Admin password.</p>
                    </div>
                </div>

                {activeTab === 'email' ? (
                    <form onSubmit={handleUpdateEmail} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Email Address</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={emailForm.email}
                                    onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <label className="block text-sm font-bold text-gray-900 mb-1">Confirm with Super Admin Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-900" />
                                <input
                                    type="password"
                                    required
                                    placeholder="Enter YOUR password"
                                    className="w-full pl-10 border border-gray-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-blue-50/50"
                                    value={emailForm.adminPassword}
                                    onChange={(e) => setEmailForm({ ...emailForm, adminPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Update Tenant Email</>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Tenant Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={passForm.newPassword}
                                    onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={passForm.confirmPassword}
                                    onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4 mt-6">
                            <label className="block text-sm font-bold text-gray-900 mb-1">Confirm with Super Admin Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-900" />
                                <input
                                    type="password"
                                    required
                                    placeholder="Enter YOUR password"
                                    className="w-full pl-10 border border-gray-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-blue-50/50"
                                    value={passForm.adminPassword}
                                    onChange={(e) => setPassForm({ ...passForm, adminPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Set Tenant Password</>}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
