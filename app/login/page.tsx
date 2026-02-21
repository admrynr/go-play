'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Gamepad2, Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            let userEmail = loginId;

            // If it doesn't look like an email, assume it's a username
            if (!loginId.includes('@')) {
                const { data: emailData, error: rpcError } = await supabase.rpc('get_user_email_by_username', {
                    p_username: loginId
                });

                if (rpcError || !emailData) {
                    setError('Username tidak ditemukan.');
                    setIsLoading(false);
                    return;
                }
                userEmail = emailData;
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: userEmail,
                password,
            });

            if (error) {
                setError(error.message);
            } else if (data.user) {
                // Let middleware handle the redirect based on role
                router.refresh();
            }
        } catch (err) {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] opacity-30" />
            </div>

            <div className="w-full max-w-md p-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="bg-primary/20 p-3 rounded-lg">
                            <Gamepad2 className="w-8 h-8 text-primary" />
                        </div>
                        <span className="font-heading font-bold text-2xl tracking-wider text-white">
                            GO-PLAY
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
                    <p className="text-gray-400 text-sm">Masuk untuk mengakses Page Builder</p>
                </div>

                {/* Login Form */}
                <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="loginId" className="text-sm text-gray-400">
                                Email atau Username
                            </label>
                            <input
                                id="loginId"
                                type="text"
                                value={loginId}
                                onChange={(e) => setLoginId(e.target.value)}
                                required
                                className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                placeholder="Email atau username"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm text-gray-400">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:glow-box disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5" />
                                    Login
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                            ← Kembali ke Beranda
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
