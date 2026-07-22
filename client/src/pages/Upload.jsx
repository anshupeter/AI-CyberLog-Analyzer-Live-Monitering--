import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Upload as UploadIcon, FileText, X, AlertCircle, CheckCircle2,
    Loader2, Eye, Zap, File, ShieldAlert
} from 'lucide-react';
import api from '../utils/api';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function Upload() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    function handleFile(f) {
        setError('');
        setResult(null);

        if (f.size > MAX_SIZE) {
            setError('File too large. Maximum size is 10MB.');
            return;
        }

        setFile(f);

        // Read preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n').slice(0, 35);
            setPreview(lines.join('\n'));
        };
        reader.readAsText(f.slice(0, 5000));
    }

    function handleDrop(e) {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }

    async function handleUpload() {
        if (!file) return;
        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('logfile', file);

            const res = await api.post('/logs/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(res.data);
        } catch (e) {
            setError(e.response?.data?.error || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    }

    function reset() {
        setFile(null);
        setPreview('');
        setResult(null);
        setError('');
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-cyber font-extrabold gradient-text">
                    SMART LOG INGESTION
                </h1>
                <p className="text-gray-400 text-xs lg:text-sm mt-1 font-mono">
                    Upload & analyze security log files with AI threat heuristic detection
                </p>
            </div>

            {/* Upload Zone */}
            {!result && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`upload-zone rounded-2xl p-8 lg:p-14 text-center relative overflow-hidden ${
                        isDragging ? 'drag-active' : ''
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !file && fileInputRef.current?.click()}
                    style={{ cursor: file ? 'default' : 'pointer' }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="*/*"
                        className="hidden"
                        onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                    />

                    {!file ? (
                        <div className="space-y-4">
                            <motion.div
                                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/40 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(0,240,255,0.25)]"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <UploadIcon size={32} className="text-neon-cyan" />
                            </motion.div>
                            <div>
                                <p className="text-lg font-bold text-gray-200">
                                    Drag & drop your security log file here
                                </p>
                                <p className="text-xs lg:text-sm text-gray-400 mt-1 font-mono">
                                    Or click anywhere to select from system — supports Apache, Syslog, JSON, CSV & TXT
                                </p>
                            </div>
                            <span className="inline-block text-[11px] font-mono text-neon-cyan/80 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20">
                                Max file limit: 10 MB
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 max-w-md mx-auto">
                                <div className="w-11 h-11 rounded-xl bg-neon-green/15 border border-neon-green/30 flex items-center justify-center">
                                    <FileText size={22} className="text-neon-green" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-200 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-400 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); reset(); }}
                                    className="p-1.5 text-gray-400 hover:text-neon-red transition-colors rounded-lg hover:bg-white/5"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                    disabled={uploading}
                                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-neon-cyan/25 via-neon-purple/20 to-neon-blue/20 text-neon-cyan border border-neon-cyan/40 hover:border-neon-cyan hover:shadow-neon-cyan transition-all text-sm font-extrabold tracking-wide disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Analyzing Log Events...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={18} />
                                            RUN AI PARSER
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {isDragging && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-neon-cyan/10 border-2 border-neon-cyan rounded-2xl backdrop-blur-sm flex items-center justify-center z-30"
                        >
                            <p className="text-lg font-extrabold text-neon-cyan tracking-wider font-cyber">DROP FILE TO INGEST</p>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-neon-red/15 border border-neon-red/40"
                    >
                        <AlertCircle size={20} className="text-neon-red flex-shrink-0" />
                        <p className="text-xs lg:text-sm text-neon-red font-mono">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Log Preview */}
            <AnimatePresence>
                {preview && !result && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-6 overflow-hidden rounded-2xl"
                    >
                        <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2 font-mono">
                            <Eye size={16} className="text-neon-cyan" />
                            Log File Raw Stream Preview (first 35 lines)
                        </h3>
                        <pre className="terminal-log text-gray-300 overflow-x-auto max-h-64 overflow-y-auto p-4 rounded-xl bg-[#040711] border border-white/5 leading-relaxed">
                            {preview}
                        </pre>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result Summary */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-6 lg:p-8 space-y-6 rounded-2xl border border-neon-green/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-neon-green/20 border border-neon-green/40 flex items-center justify-center">
                                <CheckCircle2 size={26} className="text-neon-green" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-neon-green tracking-wide">Analysis Complete</h3>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">{result.filename}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <ResultStat label="Total Entries" value={result.totalEntries} color="text-neon-cyan" />
                            <ResultStat label="Threats Identified" value={result.threatCount} color="text-neon-red" />
                            <ResultStat label="Risk Assessment" value={`${result.riskScore}/100`} color={
                                result.riskScore >= 75 ? 'text-neon-red' : result.riskScore >= 50 ? 'text-neon-orange' : result.riskScore >= 25 ? 'text-neon-yellow' : 'text-neon-green'
                            } />
                            <ResultStat label="Pipeline Status" value={result.status?.toUpperCase()} color="text-neon-green" />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => navigate(`/analysis/${result.sessionId}`)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30 transition-all text-xs lg:text-sm font-bold shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                            >
                                <Eye size={16} />
                                View Analysis Dashboard
                            </button>
                            <button
                                onClick={reset}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] text-gray-300 border border-white/10 hover:text-white hover:bg-white/[0.08] transition-all text-xs lg:text-sm font-semibold"
                            >
                                <File size={16} />
                                Ingest Another File
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Formats Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6 rounded-2xl"
            >
                <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-neon-cyan" />
                    Supported Log Engine Formats
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <Tip label="Apache / Nginx Access" desc="Combined & Common log format strings" />
                    <Tip label="Structured JSON Logs" desc="JSON lines & array log payloads" />
                    <Tip label="Linux Syslog / auth.log" desc="Authentication & audit trail logs" />
                    <Tip label="CSV / Tabular Exports" desc="Delimited cybersecurity log data" />
                </div>
            </motion.div>
        </div>
    );
}

function ResultStat({ label, value, color }) {
    return (
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
        </div>
    );
}

function Tip({ label, desc }) {
    return (
        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <FileText size={16} className="text-neon-cyan flex-shrink-0 mt-0.5" />
            <div>
                <p className="text-gray-200 font-semibold">{label}</p>
                <p className="text-gray-400 font-mono text-[11px]">{desc}</p>
            </div>
        </div>
    );
}
