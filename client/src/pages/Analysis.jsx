import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    BrainCircuit, Shield, AlertTriangle, TrendingUp, Clock,
    ChevronRight, ChevronDown, ExternalLink, Server, Globe, Loader2, FileText,
} from 'lucide-react';
import api from '../utils/api';

export default function Analysis() {
    const { sessionId } = useParams();
    const [sessions, setSessions] = useState([]);
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(sessionId || null);
    const [showLogContent, setShowLogContent] = useState(false);

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
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 size={32} className="animate-spin text-neon-cyan" />
            </div>
        );
    }

    if (!selectedSession || sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                <BrainCircuit size={64} className="mb-4 opacity-20" />
                <h2 className="text-xl font-cyber font-bold text-gray-400 mb-2">No Analysis Data</h2>
                <p className="text-sm mb-4">Upload and analyze a log file to see AI-powered insights</p>
                <Link
                    to="/upload"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-sm"
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
                    <h1 className="text-2xl lg:text-3xl font-cyber font-bold gradient-text">AI Analysis</h1>
                    <p className="text-gray-500 text-sm mt-1">Intelligent threat assessment and behavioral analysis</p>
                </div>

                {sessions.length > 1 && (
                    <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        className="bg-cyber-card border border-cyber-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-neon-cyan/30"
                    >
                        {sessions.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.filename} — Risk: {s.risk_score}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {analysisData && (
                <>
                    {/* Risk Score & Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        {/* Risk Score Gauge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-4 flex flex-col items-center justify-center"
                        >
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Risk Score</p>
                            <div className="relative w-20 h-20">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
                                    <circle
                                        cx="50" cy="50" r="42" fill="none"
                                        stroke={getScoreColor(session?.risk_score)}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(session?.risk_score / 100) * 264} 264`}
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold font-mono" style={{ color: getScoreColor(session?.risk_score) }}>
                                        {session?.risk_score || 0}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs font-semibold mt-1" style={{ color: getScoreColor(session?.risk_score) }}>
                                {getRiskLabel(session?.risk_score)}
                            </p>
                        </motion.div>

                        {/* Stats Grid */}
                        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <MiniStat icon={<Server size={16} />} label="Log Entries" value={session?.total_lines || 0} color="text-neon-cyan" />
                            <MiniStat icon={<Shield size={16} />} label="Threats" value={session?.threat_count || 0} color="text-neon-red" />
                            <MiniStat icon={<Globe size={16} />} label="Unique IPs" value={analysis?.stats?.uniqueIPs || 0} color="text-neon-purple" />
                            <MiniStat icon={<AlertTriangle size={16} />} label="Anomalies" value={analysis?.anomalies?.length || 0} color="text-neon-orange" />
                        </div>
                    </div>

                    {/* AI Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                            <BrainCircuit size={16} className="text-neon-cyan" />
                            AI Threat Assessment
                        </h3>
                        <div className="prose prose-invert prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap text-sm text-gray-400 leading-relaxed font-sans bg-transparent p-0 m-0">
                                {session?.ai_summary || 'No analysis summary available.'}
                            </pre>
                        </div>
                    </motion.div>

                    {/* IP Reputation */}
                    {analysis?.ipReputation?.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card p-5"
                        >
                            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                                <Globe size={14} className="text-neon-purple" />
                                IP Reputation Analysis
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-cyber-border">
                                            <th className="text-left py-2 px-3">IP Address</th>
                                            <th className="text-left py-2 px-3">Score</th>
                                            <th className="text-left py-2 px-3 hidden sm:table-cell">Requests</th>
                                            <th className="text-left py-2 px-3 hidden md:table-cell">Auth Failures</th>
                                            <th className="text-left py-2 px-3 hidden lg:table-cell">Threats</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.ipReputation.slice(0, 10).map((ip, i) => (
                                            <tr key={i} className="border-b border-cyber-border/50 hover:bg-white/[0.02]">
                                                <td className="py-2 px-3 font-mono text-gray-300">{ip.ip}</td>
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-cyber-border rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{
                                                                    width: `${ip.score}%`,
                                                                    background: ip.score >= 70 ? '#10B981' : ip.score >= 40 ? '#F59E0B' : '#EF4444',
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-mono text-gray-400">{ip.score}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 text-gray-500 hidden sm:table-cell">{ip.totalRequests}</td>
                                                <td className="py-2 px-3 text-gray-500 hidden md:table-cell">{ip.authFailures}</td>
                                                <td className="py-2 px-3 text-gray-500 hidden lg:table-cell">{ip.threatCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* Timeline Chart */}
                    {analysis?.timeline?.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="glass-card p-4"
                        >
                            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                                <TrendingUp size={14} className="text-neon-cyan" />
                                Activity Timeline
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analysis.timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#1e293b' }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#1e293b' }} />
                                    <Tooltip
                                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                                        itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                                        labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                                    />
                                    <Line type="monotone" dataKey="total" stroke="#00F0FF" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}

                    {/* Threats Table */}
                    {threats?.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="glass-card p-5"
                        >
                            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                                <Shield size={14} className="text-neon-red" />
                                Detected Threats ({threats.length})
                            </h3>
                            <div className="space-y-3">
                                {threats.map((threat, i) => (
                                    <motion.div
                                        key={threat.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * i }}
                                        className="p-4 rounded-lg bg-white/[0.02] border border-cyber-border/50 hover:border-neon-red/20 transition-all"
                                    >
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <span className={`severity-${threat.severity} font-bold text-sm`}>
                                                {threat.type}
                                            </span>
                                            <span className={`severity-${threat.severity} text-xs uppercase font-mono px-2 py-0.5 rounded bg-white/5`}>
                                                {threat.severity}
                                            </span>
                                            {threat.mitre_id && (
                                                <span className={`mitre-badge mitre-${threat.severity}`}>
                                                    {threat.mitre_id} — {threat.mitre_name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400">{threat.description}</p>
                                        {threat.source_ip && (
                                            <p className="text-xs text-gray-600 font-mono mt-2">Source: {threat.source_ip} · Count: {threat.count}</p>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Raw Log Content Viewer */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="glass-card overflow-hidden"
                    >
                        <button
                            onClick={() => setShowLogContent(!showLogContent)}
                            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                        >
                            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                <FileText size={14} className="text-neon-green" />
                                View Uploaded Log File ({session?.filename})
                            </h3>
                            <ChevronDown
                                size={16}
                                className={`text-gray-500 transition-transform duration-300 ${showLogContent ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {showLogContent && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="border-t border-cyber-border"
                            >
                                <div className="flex items-center gap-2 px-5 py-2 bg-black/30 border-b border-cyber-border">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono ml-2">{session?.filename}</span>
                                    <span className="text-xs text-gray-600 ml-auto font-mono">
                                        {analysisData?.rawLogContent?.split('\n').length || 0} lines
                                    </span>
                                </div>
                                <pre className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed bg-[#080c18]">
                                    {analysisData?.rawLogContent
                                        ? analysisData.rawLogContent.split('\n').map((line, i) => (
                                            <div key={i} className="hover:bg-white/[0.02] flex">
                                                <span className="text-gray-700 w-10 flex-shrink-0 text-right pr-3 select-none">{i + 1}</span>
                                                <span className="text-gray-400">{line}</span>
                                            </div>
                                        ))
                                        : <span className="text-gray-600">No log content available</span>
                                    }
                                </pre>
                            </motion.div>
                        )}
                    </motion.div>
                </>
            )}
        </div>
    );
}

function MiniStat({ icon, label, value, color }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card px-3 py-3 flex items-center gap-3"
        >
            <div className={`${color} shrink-0`}>{icon}</div>
            <div>
                <p className="text-xs text-gray-500 leading-tight">{label}</p>
                <p className={`text-xl font-bold font-mono ${color} leading-tight`}>{value}</p>
            </div>
        </motion.div>
    );
}

function getScoreColor(score) {
    if (score >= 75) return '#EF4444';
    if (score >= 50) return '#F97316';
    if (score >= 25) return '#F59E0B';
    return '#10B981';
}

function getRiskLabel(score) {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH RISK';
    if (score >= 25) return 'MODERATE';
    return 'LOW RISK';
}
