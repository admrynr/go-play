'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TenantUser {
    id: string;
    user_id: string;
    username: string;
    email: string;
    role: string;
    created_at: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Form state
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/dashboard/users');
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch users');
            }
            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError('');

        try {
            const response = await fetch('/api/dashboard/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, role: 'admin_rental' }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add user');
            }

            setUsers([data, ...users]);
            setIsAddModalOpen(false);
            setUsername('');
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus user ini? Mereka tidak akan bisa login lagi.')) return;

        try {
            const response = await fetch(`/api/dashboard/users?userId=${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete user');
            }

            setUsers(users.filter(u => u.user_id !== userId));
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-heading">User Management</h1>
                    <p className="text-gray-400">Kelola akses admin untuk rental Anda</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all hover:glow-box"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Admin
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
                    {error}
                </div>
            )}

            <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="p-4 font-semibold text-gray-300">User</th>
                                <th className="p-4 font-semibold text-gray-300">Username</th>
                                <th className="p-4 font-semibold text-gray-300">Role</th>
                                <th className="p-4 font-semibold text-gray-300">Tanggal Dibuat</th>
                                <th className="p-4 font-semibold text-gray-300 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">
                                        Belum ada admin tambahan.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-white">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            @{user.username}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20">
                                                <Shield className="w-3 h-3" />
                                                Admin Rental
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400">
                                            {new Date(user.created_at).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDeleteUser(user.user_id)}
                                                className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
                                                title="Hapus User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold font-heading">Tambah Admin Baru</h2>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    className="w-full bg-background border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    placeholder="admin1"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Hanya huruf kecil, angka, dan underscore.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-background border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    placeholder="Minimal 6 karakter"
                                    minLength={6}
                                    required
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-xl transition-colors font-medium flex justify-center items-center"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
