'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, UtensilsCrossed, Trash2, Edit2, X, Coffee, Pizza, Package } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

const CATEGORIES = [
    { id: 'food', name: 'Makanan (Food)', icon: Pizza },
    { id: 'drink', name: 'Minuman (Drink)', icon: Coffee },
    { id: 'snack', name: 'Cemilan (Snack)', icon: Package },
    { id: 'packet', name: 'Paket Hemat', icon: UtensilsCrossed },
];

export default function MenuPage() {
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [pageId, setPageId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        price: 0,
        category: 'food',
        image_url: '',
        is_available: true
    });

    const supabase = createClient();

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: page } = await supabase
            .from('pages')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (page) {
            setPageId(page.id);
            const { data } = await supabase
                .from('menu_items')
                .select('*')
                .eq('page_id', page.id)
                .order('category', { ascending: true })
                .order('name', { ascending: true });

            setMenuItems(data || []);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pageId) return;

        setLoading(true);

        if (formData.id) {
            // Update
            await supabase.from('menu_items').update({
                name: formData.name,
                description: formData.description,
                price: formData.price,
                category: formData.category,
                image_url: formData.image_url,
                is_available: formData.is_available
            }).eq('id', formData.id);
        } else {
            // Create
            await supabase.from('menu_items').insert({
                page_id: pageId,
                name: formData.name,
                description: formData.description,
                price: formData.price,
                category: formData.category,
                image_url: formData.image_url,
                is_available: formData.is_available
            });
        }

        closeModal();
        fetchMenu();
        setLoading(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Delete "${name}"?`)) {
            await supabase.from('menu_items').delete().eq('id', id);
            fetchMenu();
        }
    };

    const openEdit = (item: any) => {
        setFormData({
            id: item.id,
            name: item.name,
            description: item.description || '',
            price: item.price,
            category: item.category,
            image_url: item.image_url || '',
            is_available: item.is_available
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({
            id: '',
            name: '',
            description: '',
            price: 0,
            category: 'food',
            image_url: '',
            is_available: true
        });
    };

    if (loading && !pageId) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Menu & F&B</h1>
                    <p className="text-gray-400">Manage your food and beverages</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Item
                </button>
            </div>

            <div className="space-y-8">
                {CATEGORIES.map((cat) => {
                    const items = menuItems.filter(item => item.category === cat.id);
                    if (items.length === 0) return null;

                    return (
                        <div key={cat.id}>
                            <div className="flex items-center gap-3 mb-4">
                                <cat.icon className="w-6 h-6 text-primary" />
                                <h2 className="text-xl font-bold">{cat.name}</h2>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {items.map((item) => (
                                    <div key={item.id} className="bg-surface border border-white/10 rounded-2xl overflow-hidden group">
                                        <div className="aspect-video bg-white/5 relative">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-500">
                                                    <cat.icon className="w-12 h-12 opacity-20" />
                                                </div>
                                            )}

                                            {!item.is_available && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">Out of Stock</span>
                                                </div>
                                            )}

                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(item)}
                                                    className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold">{item.name}</h3>
                                                <span className="font-mono text-primary">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {menuItems.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-surface/50 rounded-2xl border border-dashed border-white/10">
                        <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Menu is empty. Add your first item.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{formData.id ? 'Edit Item' : 'Add New Item'}</h2>
                            <button onClick={closeModal}>
                                <X className="w-6 h-6 text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Item Image</label>
                                <ImageUpload
                                    bucket="logos" // Reuse logos bucket for now
                                    currentImage={formData.image_url}
                                    onUpload={(url) => setFormData({ ...formData, image_url: url })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Price (IDR)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                                    <select
                                        className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_available"
                                    checked={formData.is_available}
                                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                                    className="w-5 h-5 rounded border-white/10 bg-background text-primary focus:ring-primary"
                                />
                                <label htmlFor="is_available" className="text-sm">Available for Order</label>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl mt-4"
                            >
                                {formData.id ? 'Save Changes' : 'Create Item'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
