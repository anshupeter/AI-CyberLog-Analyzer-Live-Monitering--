import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BrainCircuit, Shield, AlertTriangle, ChevronRight, Server, Globe, Loader2, Eye
} from 'lucide-react';
import api from '../utils/api';

export default function Analysis() {
    const { sessionId } = useParams();
    const [sessions, setSessions] = useState([]);
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(sessionId || null);

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        if (selectedSession) fetchAnalysis(selectedSession);
    }, [selectedSession]);

    useEffect(() => {
        if (sessionId) setSelectedSession(sessionId);
    }, [sessionId]);

    async function fetchSessions() {
        try {
            const res = await api.get('/logs/sessions');
            setSessions(res.data.sessions || []);
            if (!selectedSession && res.data.sessions.length > 0) {
                setSelectedSession(res.data.sessions[0].id);
            }
        } catch (e) {
            console.error('Sessions fetch error:', e);
        } finally {
            if (!selectedSession) setLoading(false);
        }
    }

    async function fetchAnalysis(sid) {
        setLoading(true);
        try {
            const res = await api.get(`/logs/analysis/${sid}`);
            setAnalysisData(res.data);
        } catch (e) {
            console.error('Analysis fetch error:', e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-3">
                <Loader2 size={36} className="animate-spin text-neon-cyan" />
                <p className="text-xs font-mono text-gray-400">Loading AI heuristic analysis...</p>
            </div>
        );
    }

    if (!selectedSession || sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                <BrainCircuit size={64} className="mb-4 opacity-20 text-neon-cyan" />
                <h2 className="text-xl font-cyber font-bold text-gray-300 mb-2">No Analysis Sessions Recorded</h2>
                <p className="text-xs font-mono text-gray-400 mb-4">Upload and analyze a log file or run simulated traffic</p>
                <Link
                    to="/upload"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40 text-xs font-bold shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                >
                    Upload Logs <ChevronRight size={14} />
                </Link>
            </div>
        );
    }

    const { session, analysis, threats } = analysisData || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-cyber font-extrabold gradient-text flex items-center gap-3">
                        <BrainCircuit size={28} className="text-neon-cyan" />
                        AI THREAT ASSESSMENT & HEURISTICS
                    </h1>
                    <p className="text-gray-400 text-xs lg:text-sm mt-1 font-mono">Behavioral anomaly breakdown, risk scoring & threat explanation</p>
                </div>

                {sessions.length > 1 && (
                    <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        className="bg-cyber-card border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-neon-cyan"
                    >
                        {sessions.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.filename} (Risk: {s.risk_score})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {analysisData && (
                <>
                    {/* Risk Score & Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Risk Score Gauge Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden"
                        >
                            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-3">SYSTEM RISK SCORE</p>
                            <div className="relative w-28 h-28">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                    <circle
                                        cx="50" cy="50" r="40" fill="none"
                                        stroke={getScoreColor(session?.risk_score)}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(session?.risk_score / 100) * 251} 251`}
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-3xl font-extrabold font-mono" style={{ color: getScoreColor(session?.risk_score) }}>
                                        {session?.risk_score || 0}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs font-extrabold mt-3 tracking-wider uppercase font-mono" style={{ color: getScoreColor(session?.risk_score) }}>
                                {getRiskLabel(session?.risk_score)}
                            </p>
                        </motion.div>

                        {/* Stats Grid */}
                        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <MiniStat icon={<Server size={18} />} label="Total Logs" value={session?.total_lines || 0} color="text-neon-cyan" />
                            <MiniStat icon={<Shield size={18} />} label="Threat Events" value={session?.threat_count || 0} color="text-neon-red" />
                            <MiniStat icon={<Globe size={18} />} label="Unique IPs" value={analysis?.stats?.uniqueIPs || 0} color="text-neon-purple" />
                            <MiniStat icon={<AlertTriangle size={18} />} label="Anomalies" value={analysis?.anomalies?.length || 0} color="text-neon-orange" />
                        </div>
                    </div>

                    {/* AI Executive Summary Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6 lg:p-8 rounded-2xl border border-neon-cyan/20 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
                    >
                        <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2.5">
                            <BrainCircuit size={18} className="text-neon-cyan" />
                            AI Incident Summary & Behavioral Explanation
                        </h3>
                        <div className="p-4 rounded-xl bg-[#040711] border border-white/5 font-mono text-xs leading-relaxed text-gray-300">
                            {session?.ai_summary || 'No analysis summary available.'}
                        </div>
                    </motion.div>

                    {/* IP Reputation List */}
                    {analysis?.ipReputation?.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card p-6 rounded-2xl"
                        >
                            <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2.5">
                                <Globe size={16} className="text-neon-purple" />
                                Suspect IP Address Risk Rankings
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-400 text-xs font-mono uppercase tracking-wider border-b border-cyber-border">
                                            <th className="text-left py-3 px-3">IP Address</th>
                                            <th className="text-left py-3 px-3">Risk Rating</th>
                                            <th className="text-left py-3 px-3 hidden sm:table-cell">Request Count</th>
                                            <th className="text-left py-3 px-3 hidden md:table-cell">Auth Failures</th>
                                            <th className="text-left py-3 px-3 hidden lg:table-cell">Threat Matches</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {analysis.ipReputation.slice(0, 10).map((ip, i) => (
                                            <tr key={i} className="hover:bg-white/[0.04] transition-colors">
                                                <td className="py-3 px-3 font-mono text-neon-cyan font-bold">{ip.ip}</td>
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{
                                                                    width: `${Math.min(ip.score, 100)}%`,
                                                                    backgroundColor: ip.score >= 70 ? '#FF2E93' : ip.score >= 40 ? '#F97316' : '#10B981'
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-mono font-bold" style={{ color: ip.score >= 70 ? '#FF2E93' : ip.score >= 40 ? '#F97316' : '#10B981' }}>
                                                            {ip.score}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 font-mono text-gray-300 hidden sm:table-cell">{ip.requestCount}</td>
                                                <td className="py-3 px-3 font-mono text-neon-orange font-bold hidden md:table-cell">{ip.failedAuthCount}</td>
                                                <td className="py-3 px-3 font-mono text-neon-red font-bold hidden lg:table-cell">{ip.threatCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* Detected Threat Detail Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card p-6 rounded-2xl"
                    >
                        <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2.5">
                            <Eye size={16} className="text-neon-red" />
                            Detailed Threat Breakdown & Heuristic Triggers
                        </h3>
                        {threats?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {threats.map((t, idx) => (
                                    <div key={t.id || idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs text-neon-red font-mono uppercase tracking-wide">
                                                🚨 {t.type}
                                            </span>
                                            {t.mitre_id && (
                                                <span className={`mitre-badge mitre-${t.severity}`}>
                                                    {t.mitre_id}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-mono text-neon-cyan">Source IP: {t.source_ip || 'N/A'}</p>
                                        <p className="text-xs text-gray-300 leading-relaxed">{t.description}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs font-mono text-gray-500">No rule triggers activated during this session.</p>
                        )}
                    </motion.div>
                </>
            )}
        </div>
    );
}

function MiniStat({ icon, label, value, color }) {
    return (
        <div className="glass-card p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-white/[0.03] border border-white/5 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{label}</p>
                <p className={`text-lg font-extrabold font-mono text-white`}>{value}</p>
            </div>
        </div>
    );
}

function getScoreColor(score = 0) {
    if (score >= 75) return '#FF2E93';
    if (score >= 50) return '#F97316';
    if (score >= 25) return '#F59E0B';
    return '#10B981';
}

function getRiskLabel(score = 0) {
    if (score >= 75) return 'CRITICAL RISK';
    if (score >= 50) return 'HIGH THREAT LEVEL';
    if (score >= 25) return 'MODERATE RISKS';
    return 'MINIMAL RISK';
}
