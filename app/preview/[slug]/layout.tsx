'use client';

import { useState } from 'react';
import {
    LayoutDashboard,
    Monitor,
    UtensilsCrossed,
    ChefHat,
    Settings,
    Menu,
    X,
    BarChart3,
    LayoutTemplate,
    Eye
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PreviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();
    const slug = pathname.split('/')[2]; // /preview/[slug]/...
    const basePath = `/preview/${slug}`;

    const navItems = [
        { name: 'Overview', href: basePath, icon: LayoutDashboard },
        { name: 'Stations', href: `${basePath}/stations`, icon: Monitor },
        { name: 'Menu & F&B', href: `${basePath}/menu`, icon: UtensilsCrossed },
        { name: 'Kitchen Orders', href: `${basePath}/kitchen`, icon: ChefHat },
        { name: 'Reports', href: `${basePath}/reports`, icon: BarChart3 },
        { name: 'Settings', href: `${basePath}/settings`, icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background text-white flex">
            {/* Sidebar - identical to dashboard */}
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
                        const isActive = pathname === item.href ||
                            (item.href !== basePath && pathname.startsWith(item.href));
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

                {/* Preview mode indicator instead of logout */}
                <div className="absolute bottom-0 w-full p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-4 py-3 w-full text-orange-400 bg-orange-500/10 rounded-xl">
                        <Eye className="w-5 h-5" />
                        <span className="font-medium text-sm">Preview Mode</span>
                    </div>
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

                {/* Preview Banner */}
                <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-2 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-orange-400 font-medium">
                        Mode Preview — Tampilan Read-Only
                    </span>
                </div>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-y-auto pb-24">
                    {/* Email Badge (demo) */}
                    <div className="flex justify-end mb-6">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
                            demo@antigravity.demo
                        </span>
                    </div>

                    {children}
                </main>
            </div>

            {/* Floating CTA Banner */}
            <div className="fixed bottom-0 left-0 right-0 z-50 md:left-64">
                <div className="bg-gradient-to-r from-primary via-blue-600 to-primary border-t border-white/20">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-white font-bold text-sm md:text-base">
                                Suka dengan tampilan ini?
                            </p>
                            <p className="text-white/70 text-xs md:text-sm">
                                Kelola rental Anda dengan dashboard profesional
                            </p>
                        </div>
                        <Link
                            href={`${basePath}/claim`}
                            className="bg-white text-primary font-bold py-2.5 px-6 rounded-xl hover:bg-gray-100 transition-all whitespace-nowrap text-sm md:text-base shadow-lg"
                        >
                            Ambil Alih Akun Ini
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
