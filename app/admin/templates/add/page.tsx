'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddTemplatePage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const supabase = createClient();

    const handleAddTemplate = async () => {
        setStatus('loading');
        setMessage('Adding PlayZone template...');

        try {
            const { data, error } = await supabase
                .from('templates')
                .insert({
                    name: 'PlayZone Gaming',
                    description: 'Modern gaming club template with vibrant purple/pink/blue gradients, neon effects, and futuristic gaming aesthetics',
                    component_name: 'PlayZoneTemplate',
                    default_config: { themeColor: '#9333EA' },
                    is_active: true
                })
                .select();

            if (error) {
                if (error.code === '23505') {
                    setStatus('success');
                    setMessage('✅ PlayZone template already exists in database!');
                } else {
                    throw error;
                }
            } else {
                setStatus('success');
                setMessage(`✅ PlayZone template added successfully! ID: ${data[0].id}`);
            }
        } catch (err: any) {
            setStatus('error');
            setMessage(`❌ Error: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-background text-white p-8">
            <div className="max-w-2xl mx-auto">
                <Link
                    href="/admin/templates"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Templates
                </Link>

                <div className="bg-surface border border-white/10 rounded-2xl p-8">
                    <h1 className="text-3xl font-bold mb-2">Add PlayZone Template</h1>
                    <p className="text-gray-400 mb-8">
                        This utility page adds the PlayZone Gaming template to your database.
                    </p>

                    <div className="space-y-4 mb-8">
                        <div className="p-4 bg-background rounded-lg border border-white/5">
                            <h3 className="font-bold mb-1">Template Name</h3>
                            <p className="text-gray-400">PlayZone Gaming</p>
                        </div>
                        <div className="p-4 bg-background rounded-lg border border-white/5">
                            <h3 className="font-bold mb-1">Component</h3>
                            <p className="text-gray-400">PlayZoneTemplate</p>
                        </div>
                        <div className="p-4 bg-background rounded-lg border border-white/5">
                            <h3 className="font-bold mb-1">Description</h3>
                            <p className="text-gray-400">Modern gaming club template with vibrant purple/pink/blue gradients, neon effects, and futuristic gaming aesthetics</p>
                        </div>
                    </div>

                    <button
                        onClick={handleAddTemplate}
                        disabled={status === 'loading' || status === 'success'}
                        className="w-full bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-colors"
                    >
                        {status === 'loading' ? 'Adding Template...' : status === 'success' ? 'Template Added' : 'Add Template to Database'}
                    </button>

                    {message && (
                        <div className={`mt-6 p-4 rounded-lg border ${status === 'success'
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : status === 'error'
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                    : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                            }`}>
                            {message}
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-400 text-sm">
                                ✨ Template is now available! You can now select it when creating new rental pages.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
