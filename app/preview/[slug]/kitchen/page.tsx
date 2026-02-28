import { getPreviewPageData } from '@/lib/preview/getPreviewData';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChefHat } from 'lucide-react';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function PreviewKitchenPage({ params }: PageProps) {
    const { slug } = await params;
    const data = await getPreviewPageData(slug);
    if (!data) redirect('/');

    const supabase = await createClient();

    const { data: orders } = await supabase
        .from('orders')
        .select(`
            *,
            sessions ( stations (name) ),
            order_items ( quantity, price, menu_items (name) )
        `)
        .eq('page_id', data.pageId)
        .not('status', 'in', '("paid","completed")')
        .order('created_at', { ascending: false });

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Kitchen & Orders</h1>
                    <p className="text-gray-400">Incoming food and drink orders</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(orders || []).map((order) => (
                    <div key={order.id} className={`bg-surface border-2 rounded-2xl p-6 ${order.status === 'pending' ? 'border-primary' : 'border-white/10'}`}>
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
                                    'bg-gray-500 text-white'}`}>
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

                        {/* No action buttons in preview */}
                        <div className="text-xs text-gray-500 text-center py-2 bg-white/5 rounded-xl">
                            Preview Mode — Actions Disabled
                        </div>
                    </div>
                ))}

                {(!orders || orders.length === 0) && (
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
