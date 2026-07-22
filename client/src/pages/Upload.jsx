import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Upload as UploadIcon, FileText, X, AlertCircle, CheckCircle2,
    Loader2, Eye, Zap, File,
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
            const lines = text.split('\n').slice(0, 30);
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
                <h1 className="text-2xl lg:text-3xl font-cyber font-bold gradient-text">Upload Logs</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Drag & drop log files for AI-powered analysis and threat detection
                </p>
            </div>

            {/* Upload Zone */}
            {!result && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`upload-zone rounded-xl p-8 lg:p-12 text-center relative overflow-hidden ${isDragging ? 'drag-active' : ''
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
                                className="w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mx-auto"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <UploadIcon size={28} className="text-neon-cyan" />
                            </motion.div>
                            <div>
                                <p className="text-lg font-medium text-gray-300">
                                    Drop your log file here
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    or click to browse — any log file format supported
                                </p>
                            </div>
                            <p className="text-xs text-gray-600">Maximum file size: 10MB</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-neon-green/10 border border-neon-green/20 flex items-center justify-center">
                                    <FileText size={20} className="text-neon-green" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-300">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); reset(); }}
                                    className="ml-2 p-1 text-gray-500 hover:text-neon-red transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                    disabled={uploading}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 text-neon-cyan border border-neon-cyan/30 hover:border-neon-cyan/50 hover:shadow-neon-cyan transition-all text-sm font-semibold disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={16} />
                                            Analyze File
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
                            className="absolute inset-0 bg-neon-cyan/5 border-2 border-neon-cyan/40 rounded-xl flex items-center justify-center"
                        >
                            <p className="text-lg font-medium text-neon-cyan">Release to upload</p>
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
                        className="flex items-center gap-3 p-4 rounded-lg bg-neon-red/10 border border-neon-red/20"
                    >
                        <AlertCircle size={18} className="text-neon-red flex-shrink-0" />
                        <p className="text-sm text-neon-red">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview */}
            <AnimatePresence>
                {preview && !result && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-5 overflow-hidden"
                    >
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <Eye size={14} className="text-neon-cyan" />
                            Log Preview (first 30 lines)
                        </h3>
                        <pre className="terminal-log text-gray-400 overflow-x-auto max-h-64 overflow-y-auto p-3 rounded-lg bg-black/30">
                            {preview}
                        </pre>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-6 space-y-5"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center">
                                <CheckCircle2 size={22} className="text-neon-green" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-neon-green">Analysis Complete</h3>
                                <p className="text-sm text-gray-500">{result.filename}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <ResultStat label="Log Entries" value={result.totalEntries} color="text-neon-cyan" />
                            <ResultStat label="Threats" value={result.threatCount} color="text-neon-red" />
                            <ResultStat label="Risk Score" value={`${result.riskScore}/100`} color={
                                result.riskScore >= 75 ? 'text-neon-red' : result.riskScore >= 50 ? 'text-neon-orange' : result.riskScore >= 25 ? 'text-neon-yellow' : 'text-neon-green'
                            } />
                            <ResultStat label="Status" value={result.status} color="text-neon-green" />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate(`/analysis/${result.sessionId}`)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 transition-all text-sm font-medium"
                            >
                                <Eye size={16} />
                                View Full Analysis
                            </button>
                            <button
                                onClick={reset}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 border border-cyber-border hover:text-gray-200 hover:bg-white/10 transition-all text-sm"
                            >
                                <File size={16} />
                                Upload Another
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tips */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-5"
            >
                <h3 className="text-sm font-semibold text-gray-300 mb-3">💡 Supported Log Formats</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-500">
                    <Tip label="Apache/Nginx" desc="Combined or common log format" />
                    <Tip label="JSON Logs" desc="Structured JSON log entries" />
                    <Tip label="Syslog / auth.log" desc="Linux system and auth logs" />
                    <Tip label="CSV Logs" desc="Comma-separated log data" />
                </div>
                <p className="text-xs text-gray-600 mt-3">
                    A sample log file is included at <code className="text-neon-cyan/70">database/sample.log</code> for testing.
                </p>
            </motion.div>
        </div>
    );
}

function ResultStat({ label, value, color }) {
    return (
        <div className="p-3 rounded-lg bg-white/[0.02] border border-cyber-border/50">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
        </div>
    );
}

function Tip({ label, desc }) {
    return (
        <div className="flex items-start gap-2">
            <FileText size={14} className="text-neon-cyan/50 flex-shrink-0 mt-0.5" />
            <div>
                <p className="text-gray-400 font-medium">{label}</p>
                <p className="text-gray-600">{desc}</p>
            </div>
        </div>
    );
}
