'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChefHat, CheckCircle, Clock } from 'lucide-react';

export default function KitchenPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageId, setPageId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        // Initial fetch
        fetchOrders();

        // Polling every 10 seconds for new orders (Simpler than setting up Realtime for MVP)
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get page_id if not set
        let pid = pageId;
        if (!pid) {
            const { data: page } = await supabase
                .from('pages')
                .select('id')
                .eq('owner_id', user.id)
                .single();
            if (page) {
                setPageId(page.id);
                pid = page.id;
            }
        }

        if (pid) {
            const { data } = await supabase
                .from('orders')
                .select(`
          *,
          sessions (
            stations (name)
          ),
          order_items (
            quantity,
            price,
            menu_items (name)
          )
        `)
                .eq('page_id', pid)
                .not('status', 'in', '("paid","completed")') // Hide paid/completed
                .order('created_at', { ascending: false });

            setOrders(data || []);
        }
        setLoading(false);
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        fetchOrders();
    };

    if (loading && !pageId) return <div>Loading orders...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Kitchen & Orders</h1>
                    <p className="text-gray-400">Incoming food and drink orders</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order) => {
                    const isPending = order.status === 'pending';
                    const isServed = order.status === 'served';

                    return (
                        <div key={order.id} className={`bg-surface border-2 rounded-2xl p-6 ${isPending ? 'border-primary animate-pulse-border' : 'border-white/10'
                            }`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">
                                        {order.sessions?.stations?.name || 'Unknown Station'}
                                    </h3>
                                    <span className="text-xs text-gray-400 font-mono">
                                        {new Date(order.created_at).toLocaleTimeString('id-ID')}
                                    </span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'pending' ? 'bg-primary text-white' :
                                    order.status === 'served' ? 'bg-green-500 text-white' :
                                        'bg-gray-500 text-white'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="space-y-3 mb-6">
                                {order.order_items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold bg-white/10 w-6 h-6 flex items-center justify-center rounded-md">
                                                {item.quantity}x
                                            </span>
                                            <span>{item.menu_items?.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                {isPending && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'served')}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        Mark Served
                                    </button>
                                )}
                                {isServed && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'paid')}
                                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        Mark Paid (Done)
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {orders.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-500 bg-surface/50 rounded-2xl border border-dashed border-white/10">
                        <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold mb-2">No Active Orders</h3>
                        <p>Wait for players to order from QR code</p>
                    </div>
                )}
            </div>
        </div>
    );
}
