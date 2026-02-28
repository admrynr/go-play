'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, Play, CheckCircle2, XCircle, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface LeadRow {
    name: string;
    phone: string;
    address: string;
    website: string;
    rating: number;
    reviews: number;
}

interface ProcessResult {
    name: string;
    slug: string;
    email: string;
    status: 'success' | 'error';
    error?: string;
}

export default function BulkOnboardingPage() {
    const [leads, setLeads] = useState<LeadRow[]>([]);
    const [fileName, setFileName] = useState('');
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState<ProcessResult[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseFile = useCallback((file: File) => {
        setFileName(file.name);
        setResults([]);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<any>(sheet);

                const parsed: LeadRow[] = json.map((row: any) => ({
                    name: row.name || row.Name || row.business_name || '',
                    phone: row.phone || row.Phone || row.whatsapp || '',
                    address: row.address || row.Address || '',
                    website: row.website || row.Website || '',
                    rating: parseFloat(row.rating || row.Rating || '0') || 0,
                    reviews: parseInt(row.reviews || row.Reviews || '0') || 0,
                })).filter((r: LeadRow) => r.name.trim() !== '');

                setLeads(parsed);
            } catch (err) {
                alert('Failed to parse file. Please ensure it is a valid CSV or XLSX file.');
                console.error(err);
            }
        };
        reader.readAsBinaryString(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) parseFile(file);
    }, [parseFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) parseFile(file);
    }, [parseFile]);

    const handleProcess = async () => {
        if (leads.length === 0) return;

        setProcessing(true);
        setProgress({ current: 0, total: leads.length });
        setResults([]);

        // Process in batches of 5 to avoid timeout
        const batchSize = 5;
        const allResults: ProcessResult[] = [];

        for (let i = 0; i < leads.length; i += batchSize) {
            const batch = leads.slice(i, i + batchSize);

            try {
                const res = await fetch('/api/admin/onboarding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leads: batch }),
                });

                const data = await res.json();

                if (data.results) {
                    allResults.push(...data.results);
                    setResults([...allResults]);
                }
            } catch (err: any) {
                // Mark batch as failed
                batch.forEach((lead) => {
                    allResults.push({
                        name: lead.name,
                        slug: '',
                        email: '',
                        status: 'error',
                        error: err.message || 'Network error',
                    });
                });
                setResults([...allResults]);
            }

            setProgress({ current: Math.min(i + batchSize, leads.length), total: leads.length });
        }

        setProcessing(false);
    };

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    return (
        <div className="min-h-screen bg-background text-white">
            {/* Header */}
            <header className="bg-surface border-b border-white/10 p-6">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-heading font-bold">Bulk Onboarding</h1>
                        <p className="text-gray-400 text-sm">Upload leads data to create tenant preview accounts</p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6 space-y-8">
                {/* Step 1: Upload */}
                <section className="bg-surface border border-white/10 rounded-2xl p-8">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">1</span>
                        Upload Leads File
                    </h2>

                    <div
                        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${dragOver
                            ? 'border-primary bg-primary/10'
                            : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                            }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-lg font-medium mb-1">
                            {fileName || 'Drop your CSV or Excel file here'}
                        </p>
                        <p className="text-sm text-gray-500">
                            or click to browse • Supports .csv, .xlsx
                        </p>
                    </div>

                    {fileName && (
                        <div className="mt-4 flex items-center gap-3 bg-white/5 px-4 py-3 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-green-400" />
                            <span className="font-medium">{fileName}</span>
                            <span className="text-sm text-gray-400">— {leads.length} leads detected</span>
                            <button
                                onClick={() => { setLeads([]); setFileName(''); setResults([]); }}
                                className="ml-auto p-1 hover:bg-white/10 rounded transition-colors"
                            >
                                <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                        </div>
                    )}
                </section>

                {/* Step 2: Preview */}
                {leads.length > 0 && (
                    <section className="bg-surface border border-white/10 rounded-2xl p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">2</span>
                                Preview Leads ({leads.length})
                            </h2>
                            <button
                                onClick={handleProcess}
                                disabled={processing || results.length > 0}
                                className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2"
                            >
                                {processing ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                ) : results.length > 0 ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Done</>
                                ) : (
                                    <><Play className="w-4 h-4" /> Process All</>
                                )}
                            </button>
                        </div>

                        {/* Progress Bar */}
                        {(processing || results.length > 0) && (
                            <div className="mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">
                                        {processing ? 'Processing...' : 'Complete'}
                                    </span>
                                    <span className="font-mono font-bold">
                                        {progress.current}/{progress.total}
                                        {results.length > 0 && (
                                            <span className="ml-3">
                                                <span className="text-green-400">{successCount} ✓</span>
                                                {errorCount > 0 && <span className="text-red-400 ml-2">{errorCount} ✗</span>}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500"
                                        style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="text-gray-400 border-b border-white/10 text-xs uppercase">
                                        <th className="p-3">#</th>
                                        <th className="p-3">Business Name</th>
                                        <th className="p-3">Phone</th>
                                        <th className="p-3">Rating</th>
                                        <th className="p-3">Reviews</th>
                                        {results.length > 0 && (
                                            <>
                                                <th className="p-3">Slug</th>
                                                <th className="p-3">Status</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead, i) => {
                                        const result = results[i];
                                        return (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-3 text-gray-500">{i + 1}</td>
                                                <td className="p-3 font-medium">{lead.name}</td>
                                                <td className="p-3 text-gray-400 font-mono text-xs">{lead.phone}</td>
                                                <td className="p-3">
                                                    {lead.rating > 0 && (
                                                        <span className="text-yellow-400">★ {lead.rating}</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-gray-400">{lead.reviews || '-'}</td>
                                                {results.length > 0 && (
                                                    <>
                                                        <td className="p-3 font-mono text-xs text-primary">{result?.slug || '—'}</td>
                                                        <td className="p-3">
                                                            {result?.status === 'success' ? (
                                                                <span className="flex items-center gap-1 text-green-400 text-xs">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Success
                                                                </span>
                                                            ) : result?.status === 'error' ? (
                                                                <span className="flex items-center gap-1 text-red-400 text-xs" title={result.error}>
                                                                    <XCircle className="w-3.5 h-3.5" /> {result.error?.slice(0, 30)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-500 text-xs">Pending</span>
                                                            )}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Results Summary */}
                {results.length > 0 && !processing && (
                    <section className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-green-400 mb-2">
                            Onboarding Complete!
                        </h3>
                        <p className="text-gray-300 mb-4">
                            {successCount} tenants created successfully.
                            {errorCount > 0 && ` ${errorCount} failed.`}
                        </p>
                        <div className="flex gap-3">
                            <Link
                                href="/admin/tenants"
                                className="bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm"
                            >
                                View All Tenants
                            </Link>
                            <button
                                onClick={() => { setLeads([]); setFileName(''); setResults([]); setProgress({ current: 0, total: 0 }); }}
                                className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm"
                            >
                                Upload Another File
                            </button>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
