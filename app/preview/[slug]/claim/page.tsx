'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Lock, Mail, User, ArrowRight, ShieldCheck, Sparkles, AtSign, CheckCircle, XCircle } from 'lucide-react';

export default function ClaimPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [loading, setLoading] = useState(true);
    const [tenantName, setTenantName] = useState('');
    const [currentUsername, setCurrentUsername] = useState('');
    const [claiming, setClaiming] = useState(false);
    const [success, setSuccess] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        // Fetch tenant info
        const fetchTenant = async () => {
            try {
                const res = await fetch(`/api/claim?slug=${slug}`);
                const data = await res.json();
                if (data.tenant) {
                    setTenantName(data.tenant.business_name);
                    setCurrentUsername(data.tenant.username);
                    setForm((prev) => ({ ...prev, username: data.tenant.username }));
                    setUsernameStatus('available');
                } else {
                    router.push('/');
                }
            } catch {
                router.push('/');
            } finally {
                setLoading(false);
            }
        };
        fetchTenant();
    }, [slug, router]);

    // Debounced username check
    useEffect(() => {
        if (!form.username || form.username === currentUsername) {
            if (form.username === currentUsername) setUsernameStatus('available');
            return;
        }

        setUsernameStatus('checking');
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/claim?checkUsername=${encodeURIComponent(form.username)}`);
                const data = await res.json();
                setUsernameStatus(data.available ? 'available' : 'taken');
            } catch {
                setUsernameStatus('idle');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [form.username, currentUsername]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (usernameStatus === 'taken') {
            alert('Username sudah digunakan, pilih yang lain');
            return;
        }

        if (!form.username || form.username.length < 3) {
            alert('Username minimal 3 karakter');
            return;
        }

        if (form.password !== form.confirmPassword) {
            alert('Password konfirmasi tidak sesuai');
            return;
        }

        if (form.password.length < 6) {
            alert('Password minimal 6 karakter');
            return;
        }

        setClaiming(true);

        try {
            const res = await fetch('/api/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    username: form.username,
                    email: form.email,
                    password: form.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Gagal mengambil alih akun');
            }

            setSuccess(true);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setClaiming(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-6 text-center">
                <div className="bg-surface border border-white/10 rounded-2xl p-10 max-w-md w-full">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-8 h-8 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3">Selamat! 🎉</h1>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                        Akun <span className="text-primary font-bold">{tenantName}</span> sekarang resmi milik Anda.
                        Kami telah membersihkan data simulasi agar Anda bisa mulai mencatat transaksi asli.
                    </p>
                    <a
                        href="/login"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl transition-all w-full justify-center"
                    >
                        Masuk ke Dashboard <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-6">
            <div className="bg-surface border border-white/10 rounded-2xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-7 h-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-heading font-bold mb-2">Ambil Alih Akun</h1>
                    <p className="text-gray-400 text-sm">
                        Klaim akun <span className="text-primary font-bold">{tenantName}</span> dengan mengisi email dan password baru Anda
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
                        <div className="relative">
                            <AtSign className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                required
                                minLength={3}
                                placeholder="username-anda"
                                className={`w-full pl-10 pr-10 bg-white/5 border text-white rounded-xl px-4 py-3 focus:ring-2 focus:outline-none transition-all ${usernameStatus === 'taken' ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500/50' :
                                        usernameStatus === 'available' ? 'border-green-500/50 focus:ring-green-500 focus:border-green-500/50' :
                                            'border-white/10 focus:ring-primary focus:border-primary/50'
                                    }`}
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                            />
                            {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
                            {usernameStatus === 'available' && <CheckCircle className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />}
                            {usernameStatus === 'taken' && <XCircle className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />}
                        </div>
                        {usernameStatus === 'taken' && <p className="text-xs text-red-400 mt-1">Username sudah digunakan</p>}
                        {form.username === currentUsername && <p className="text-xs text-gray-500 mt-1">Username saat ini (tidak diubah)</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="email"
                                required
                                placeholder="email@anda.com"
                                className="w-full pl-10 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none focus:border-primary/50 transition-all"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Password Baru</label>
                        <div className="relative">
                            <Lock className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                placeholder="Minimal 6 karakter"
                                className="w-full pl-10 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none focus:border-primary/50 transition-all"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Konfirmasi Password</label>
                        <div className="relative">
                            <Lock className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                placeholder="Ulangi password"
                                className="w-full pl-10 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none focus:border-primary/50 transition-all"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            />
                        </div>
                        {form.confirmPassword && form.password !== form.confirmPassword && (
                            <p className="text-xs text-red-400 mt-1">Password tidak cocok</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={claiming || usernameStatus === 'taken' || usernameStatus === 'checking'}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-6"
                    >
                        {claiming ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" /> Klaim Akun Ini
                            </>
                        )}
                    </button>
                </form>

                <p className="text-xs text-gray-500 text-center mt-6">
                    Dengan mengklaim akun ini, data simulasi akan dihapus dan diganti dengan akun asli Anda.
                </p>
            </div>
        </div>
    );
}
