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
    BarChart3,
    LayoutTemplate,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [businessName, setBusinessName] = useState('GO-PLAY');
    const [pageId, setPageId] = useState<string | null>(null);
    const [role, setRole] = useState<'owner' | 'admin_rental' | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    // Close sidebar on navigation (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUserEmail(user.email || '');

            // Check if user has a rental page (Owner)
            const { data: page } = await supabase
                .from('pages')
                .select('id, business_name, logo_text')
                .eq('owner_id', user.id)
                .single();

            if (page) {
                setRole('owner');
                setPageId(page.id);
                setBusinessName(page.logo_text || page.business_name || 'GO-PLAY');
            } else {
                // Check if user is an admin rental
                const { data: adminData } = await supabase
                    .from('tenant_users')
                    .select('tenant_id, role')
                    .eq('user_id', user.id)
                    .single();
                
                if (adminData) {
                    setRole(adminData.role as 'admin_rental');
                    // Fetch the page for this tenant
                    const { data: adminPage } = await supabase
                        .from('pages')
                        .select('id, business_name, logo_text')
                        .eq('tenant_id', adminData.tenant_id)
                        .single();
                        
                    if (adminPage) {
                        setPageId(adminPage.id);
                        setBusinessName(adminPage.logo_text || adminPage.business_name || 'GO-PLAY');
                    }
                }
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
        { name: 'Page Builder', href: '/builder', icon: LayoutTemplate },
        ...(role === 'owner' ? [{ name: 'User Management', href: '/dashboard/users', icon: Users }] : []),
    ];

    return (
        <div className="min-h-screen bg-background text-white flex">
            {/* Sidebar Backdrop */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 animate-in fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-surface border-r border-white/10 transition-transform duration-300 transform ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <Link href="/" className="font-heading font-bold text-2xl text-primary truncate max-w-[160px]" title={businessName}>
                        {businessName}
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-white transition-colors">
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
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25 font-bold'
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
                <header className="md:hidden p-4 bg-surface border-b border-white/10 flex justify-between items-center sticky top-0 z-20">
                    <Link href="/" className="font-heading font-bold text-xl text-primary truncate max-w-[180px]" title={businessName}>
                        {businessName}
                    </Link>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors">
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
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
