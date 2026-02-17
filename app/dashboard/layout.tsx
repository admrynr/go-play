'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    LayoutDashboard,
    Monitor,
    UtensilsCrossed,
    ChefHat,
    Settings,
    LogOut,
    Menu,
    X,
    CreditCard,
    BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userEmail, setUserEmail] = useState('');
    const [pageId, setPageId] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUserEmail(user.email || '');

            // Check if user has a rental page
            const { data: page } = await supabase
                .from('pages')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (page) {
                setPageId(page.id);
            }
        };
        checkUser();
    }, [supabase, router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const navItems = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Stations', href: '/dashboard/stations', icon: Monitor },
        { name: 'Menu & F&B', href: '/dashboard/menu', icon: UtensilsCrossed },
        { name: 'Kitchen Orders', href: '/dashboard/kitchen', icon: ChefHat },
        // { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
        { name: 'Reports', href: '/dashboard/reports', icon: Monitor }, // Using Monitor temporary if BarChart3 fails, but let's try to stick to existing icons if needed or just use LayoutDashboard
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background text-white flex">
            {/* Sidebar */}
            <aside
                className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-surface border-r border-white/10 transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <Link href="/" className="font-heading font-bold text-2xl text-primary">
                        GO-PLAY
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="md:hidden p-4 bg-surface border-b border-white/10 flex justify-between items-center">
                    <Link href="/" className="font-heading font-bold text-xl text-primary">
                        GO-PLAY
                    </Link>
                    <button onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {/* Email Badge */}
                    <div className="flex justify-end mb-6">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
                            {userEmail}
                        </span>
                    </div>

                    {children}
                </main>
            </div>
        </div>
    );
}
