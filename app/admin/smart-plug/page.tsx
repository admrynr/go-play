'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plug, Zap, ZapOff, RefreshCw, Wifi, WifiOff, Activity, Clock } from 'lucide-react';
import Link from 'next/link';

interface LogEntry {
    time: string;
    action: string;
    success: boolean;
}

export default function SmartPlugPage() {
    const [isOn, setIsOn] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [deviceName, setDeviceName] = useState('Smart Plug');
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const supabase = createClient();
    const router = useRouter();

    const addLog = (action: string, success: boolean) => {
        setLogs(prev => [
            { time: new Date().toLocaleTimeString('id-ID'), action, success },
            ...prev.slice(0, 19), // Keep last 20 entries
        ]);
    };

    const fetchStatus = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const res = await fetch('/api/admin/tuya/status', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch status');
            }

            // Parse device status
            if (data.status?.success && Array.isArray(data.status.result)) {
                const switchStatus = data.status.result.find(
                    (s: any) => s.code === 'switch_1' || s.code === 'switch'
                );
                if (switchStatus) {
                    setIsOn(switchStatus.value === true);
                }
            }

            // Parse device info
            if (data.info?.success && data.info.result) {
                setIsOnline(data.info.result.online === true);
                setDeviceName(data.info.result.name || 'Smart Plug Lavio');
            }

            setError(null);
            setLastRefresh(new Date());
        } catch (err: any) {
            setError(err.message);
            addLog(`Error: ${err.message}`, false);
        } finally {
            setLoading(false);
        }
    }, [supabase, router]);

    useEffect(() => {
        fetchStatus();

        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleToggle = async () => {
        if (toggling || !isOnline) return;

        setToggling(true);
        const newValue = !isOn;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/admin/tuya/command', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: 'switch_1',
                    value: newValue,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send command');
            }

            if (data.result?.success) {
                setIsOn(newValue);
                addLog(`Switch ${newValue ? 'ON' : 'OFF'}`, true);
            } else {
                throw new Error(data.result?.msg || 'Command failed');
            }
        } catch (err: any) {
            addLog(`Toggle failed: ${err.message}`, false);
            setError(err.message);
        } finally {
            setToggling(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-white">
            {/* Header */}
            <header className="bg-surface border-b border-white/10 p-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
                                <Plug className="w-6 h-6 text-yellow-400" />
                                Smart Plug Control
                            </h1>
                            <p className="text-gray-400 text-sm mt-0.5">Experimental · Tuya IoT Integration</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setLoading(true); fetchStatus(); }}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Error Banner */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Device Status Card */}
                <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
                    {/* Status Header */}
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${isOnline ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                    {isOnline ? (
                                        <Wifi className="w-6 h-6 text-green-400" />
                                    ) : (
                                        <WifiOff className="w-6 h-6 text-red-400" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">{deviceName}</h2>
                                    <p className={`text-sm ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                                        {loading ? 'Checking...' : isOnline ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                            {lastRefresh && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    {lastRefresh.toLocaleTimeString('id-ID')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Big Toggle Button */}
                    <div className="p-12 flex flex-col items-center justify-center">
                        {/* LED Indicator */}
                        <div className={`w-4 h-4 rounded-full mb-6 transition-all duration-500 ${
                            isOn
                                ? 'bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.6),0_0_40px_rgba(74,222,128,0.3)]'
                                : 'bg-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                        }`} />

                        {/* Power Button */}
                        <button
                            onClick={handleToggle}
                            disabled={toggling || loading || !isOnline}
                            className={`
                                relative w-40 h-40 rounded-full border-4 transition-all duration-500 
                                flex items-center justify-center
                                ${toggling ? 'animate-pulse' : ''}
                                ${!isOnline || loading
                                    ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50'
                                    : isOn
                                        ? 'border-green-400/60 bg-green-500/10 hover:bg-green-500/20 hover:border-green-400 hover:shadow-[0_0_40px_rgba(74,222,128,0.2)] cursor-pointer'
                                        : 'border-gray-600 bg-white/5 hover:bg-white/10 hover:border-gray-400 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] cursor-pointer'
                                }
                            `}
                        >
                            {/* Power icon */}
                            <svg
                                viewBox="0 0 24 24"
                                className={`w-16 h-16 transition-all duration-500 ${
                                    isOn ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-gray-500'
                                }`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                                <line x1="12" y1="2" x2="12" y2="12" />
                            </svg>

                            {/* Rotating ring when toggling */}
                            {toggling && (
                                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                            )}
                        </button>

                        {/* Status Text */}
                        <div className="mt-6 text-center">
                            <p className={`text-2xl font-bold transition-colors duration-500 ${
                                isOn ? 'text-green-400' : 'text-gray-500'
                            }`}>
                                {loading ? 'Loading...' : toggling ? 'Switching...' : isOn ? 'ON' : 'OFF'}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                                {!isOnline ? 'Device offline' : 'Tap button to toggle'}
                            </p>
                        </div>
                    </div>

                    {/* Quick Status Bar */}
                    <div className="grid grid-cols-3 border-t border-white/5">
                        <div className="p-4 text-center border-r border-white/5">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                {isOn ? (
                                    <Zap className="w-4 h-4 text-yellow-400" />
                                ) : (
                                    <ZapOff className="w-4 h-4 text-gray-600" />
                                )}
                            </div>
                            <p className="text-xs text-gray-500">Power</p>
                            <p className={`text-sm font-bold ${isOn ? 'text-yellow-400' : 'text-gray-600'}`}>
                                {isOn ? 'Active' : 'Idle'}
                            </p>
                        </div>
                        <div className="p-4 text-center border-r border-white/5">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Activity className={`w-4 h-4 ${isOnline ? 'text-green-400' : 'text-gray-600'}`} />
                            </div>
                            <p className="text-xs text-gray-500">Connection</p>
                            <p className={`text-sm font-bold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                                {isOnline ? 'Connected' : 'Disconnected'}
                            </p>
                        </div>
                        <div className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Plug className="w-4 h-4 text-blue-400" />
                            </div>
                            <p className="text-xs text-gray-500">Device</p>
                            <p className="text-sm font-bold text-blue-400">Lavio</p>
                        </div>
                    </div>
                </div>

                {/* Activity Log */}
                <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <h3 className="font-bold text-sm">Activity Log</h3>
                        <span className="text-xs text-gray-600 ml-auto">(Session only)</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {logs.length === 0 ? (
                            <div className="p-6 text-center text-gray-600 text-sm">
                                No activity yet. Toggle the switch to see logs here.
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {logs.map((log, i) => (
                                    <div key={i} className="px-4 py-3 flex items-center gap-3 text-sm">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            log.success ? 'bg-green-400' : 'bg-red-400'
                                        }`} />
                                        <span className="text-gray-500 font-mono text-xs w-20 flex-shrink-0">
                                            {log.time}
                                        </span>
                                        <span className={log.success ? 'text-gray-300' : 'text-red-400'}>
                                            {log.action}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300/80">
                    <p className="font-bold mb-1">ℹ️ Experimental Feature</p>
                    <p>
                        Fitur ini adalah percobaan integrasi Tuya IoT Cloud API untuk mengontrol Smart Plug Lavio.
                        Status auto-refresh setiap 5 detik. Pastikan device sudah terhubung ke WiFi dan terdaftar di Tuya IoT Platform.
                    </p>
                </div>
            </main>
        </div>
    );
}
