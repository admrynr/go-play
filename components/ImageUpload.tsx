'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadProps {
    onUpload: (url: string) => void;
    currentImage?: string;
    bucket?: string;
}

export default function ImageUpload({ onUpload, currentImage, bucket = 'logos' }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileSelect = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('File harus berupa gambar');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Ukuran file maximum 5MB');
            return;
        }

        setError('');
        setUploading(true);

        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            setPreview(publicUrl);
            onUpload(publicUrl);
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Gagal upload gambar');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const clearImage = () => {
        setPreview(null);
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        onUpload('');
    };

    return (
        <div className="space-y-4">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
            />

            {preview ? (
                <div className="relative group">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-contain bg-surface rounded-xl border border-white/10"
                    />
                    <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors bg-surface"
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <p>Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                            <ImageIcon className="w-10 h-10" />
                            <div>
                                <p className="font-bold text-white">Click atau drag logo disini</p>
                                <p className="text-sm">PNG, JPG, max 5MB</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="text-red-400 text-sm">{error}</p>
            )}
        </div>
    );
}
