import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Shield, AlertTriangle, Server, Globe,
    FileWarning, Eye, ArrowUpRight, Zap, Activity, Trash2, Radio
} from 'lucide-react';
import api from '../utils/api';

const PIE_COLORS = ['#FF2E93', '#F97316', '#F59E0B', '#10B981'];

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            const res = await api.get('/logs/stats');
            setStats(res.data);
        } catch (e) {
            console.error('Dashboard stats error:', e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <DashboardSkeleton />;

    async function deleteSession(e, sessionId, filename) {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(`Delete "${filename}" and all its analysis data?`)) return;
        try {
            await api.delete(`/logs/session/${sessionId}`);
            fetchStats();
        } catch (err) {
            console.error('Delete error:', err);
        }
    }

    const severityData = stats?.severityDistribution?.map(s => ({
        name: s.severity.charAt(0).toUpperCase() + s.severity.slice(1),
        value: s.count,
    })) || [];

    const ipData = stats?.topIPs?.slice(0, 8).map(ip => ({
        ip: ip.source_ip?.length > 13 ? ip.source_ip.slice(0, 13) + '…' : ip.source_ip,
        requests: ip.count,
    })) || [];

    const threatTypeData = stats?.threatTypes?.slice(0, 6).map(t => ({
        name: t.type.length > 18 ? t.type.slice(0, 18) + '…' : t.type,
        count: t.count,
    })) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-cyber font-extrabold tracking-wide gradient-text">
                        SECURITY OPERATIONS CENTER
                    </h1>
                    <p className="text-gray-400 text-xs lg:text-sm mt-1 font-mono">Real-time threat intelligence & SOC log monitoring</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/stream"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-purple/15 text-neon-purple border border-neon-purple/40 hover:bg-neon-purple/25 transition-all text-xs lg:text-sm font-semibold shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    >
                        <Radio size={16} className="animate-pulse" />
                        Live Stream
                    </Link>
                    <Link
                        to="/upload"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/25 transition-all text-xs lg:text-sm font-semibold shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                    >
                        <Zap size={16} />
                        Upload Logs
                    </Link>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard
                    icon={<Server size={22} />}
                    label="Total Processed"
                    value={formatNum(stats?.totalLogs || 0)}
                    color="neon-cyan"
                    accentColor="from-neon-cyan/20 to-transparent"
                    delay={0}
                />
                <StatCard
                    icon={<Shield size={22} />}
                    label="Threats Detected"
                    value={stats?.totalThreats || 0}
                    color="neon-red"
                    accentColor="from-neon-red/20 to-transparent"
                    delay={0.1}
                />
                <StatCard
                    icon={<AlertTriangle size={22} />}
                    label="Critical Threats"
                    value={stats?.criticalThreats || 0}
                    color="neon-orange"
                    accentColor="from-neon-orange/20 to-transparent"
                    delay={0.2}
                />
                <StatCard
                    icon={<Globe size={22} />}
                    label="Unique Source IPs"
                    value={stats?.uniqueIPs || 0}
                    color="neon-purple"
                    accentColor="from-neon-purple/20 to-transparent"
                    delay={0.3}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Threat Severity Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-5 flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-gray-200 tracking-wide flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-neon-red pulse-dot shadow-[0_0_8px_rgba(255,46,147,0.8)]" />
                            Threat Severity Breakdown
                        </h3>
                    </div>
                    {severityData.length > 0 ? (
                        <div className="my-2">
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={severityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={95}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {severityData.map((_, index) => (
                                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(15,23,42,0.8)" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}
                                        itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                                        labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyState message="No threat data recorded" />
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        {severityData.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-mono text-gray-300 bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
                                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="truncate">{item.name}:</span>
                                <span className="font-bold ml-auto">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* IP Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-5 lg:col-span-2 flex flex-col justify-between"
                >
                    <h3 className="text-sm font-bold text-gray-200 tracking-wide mb-4 flex items-center gap-2.5">
                        <Globe size={16} className="text-neon-purple" />
                        Top Active Source IP Addresses
                    </h3>
                    {ipData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={270}>
                            <BarChart data={ipData} barSize={26} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="ip" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                                <Tooltip
                                    contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}
                                    itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                                    labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                                    cursor={{ fill: 'rgba(168,85,247,0.08)' }}
                                />
                                <Bar dataKey="requests" radius={[6, 6, 0, 0]}>
                                    {ipData.map((_, index) => (
                                        <Cell key={index} fill={`hsl(${270 + index * 12}, 85%, 62%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message="Upload logs to analyze IP activity" />
                    )}
                </motion.div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Threat Types Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-5 flex flex-col justify-between"
                    style={{ minHeight: '380px' }}
                >
                    <h3 className="text-sm font-bold text-gray-200 tracking-wide mb-3 flex items-center gap-2.5">
                        <FileWarning size={16} className="text-neon-yellow" />
                        Threat Categories & Rules Triggered
                    </h3>
                    {threatTypeData.length > 0 ? (
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={threatTypeData} layout="vertical" barSize={26} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} width={140} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                                    <Tooltip
                                        contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}
                                        itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                                        labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                                        cursor={{ fill: 'rgba(245,158,11,0.08)' }}
                                    />
                                    <Bar dataKey="count" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyState message="No threat categories detected yet" />
                    )}
                </motion.div>

                {/* Recent Sessions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-5 flex flex-col justify-between"
                >
                    <h3 className="text-sm font-bold text-gray-200 tracking-wide mb-4 flex items-center gap-2.5">
                        <Activity size={16} className="text-neon-cyan" />
                        Recent Log Analysis Sessions
                    </h3>
                    {stats?.recentSessions?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentSessions.map((session) => (
                                <Link
                                    key={session.id}
                                    to={`/analysis/${session.id}`}
                                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-neon-cyan/30 transition-all group"
                                >
                                    <div className="flex-1 min-w-0 mr-3">
                                        <p className="text-sm font-semibold text-gray-200 group-hover:text-neon-cyan transition-colors truncate">
                                            {session.filename}
                                        </p>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                                            {session.total_lines} lines · <span className="text-neon-red font-semibold">{session.threat_count} threats</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2.5 flex-shrink-0">
                                        <RiskBadge score={session.risk_score} />
                                        <button
                                            onClick={(e) => deleteSession(e, session.id, session.filename)}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-neon-red hover:bg-neon-red/15 transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete session"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                        <ArrowUpRight size={16} className="text-gray-500 group-hover:text-neon-cyan transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="No analysis sessions yet — upload a log file or start live monitoring" />
                    )}
                </motion.div>
            </div>

            {/* Recent Threats Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card p-6"
            >
                <h3 className="text-sm font-bold text-gray-200 tracking-wide mb-4 flex items-center gap-2.5">
                    <Eye size={16} className="text-neon-red" />
                    Live Detected Cyber Threats
                </h3>
                {stats?.recentThreats?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 text-xs font-mono uppercase tracking-wider border-b border-cyber-border">
                                    <th className="text-left py-3.5 px-4">Threat Type</th>
                                    <th className="text-left py-3.5 px-4">Severity</th>
                                    <th className="text-left py-3.5 px-4 hidden md:table-cell">Source IP</th>
                                    <th className="text-left py-3.5 px-4 hidden lg:table-cell">MITRE ATT&CK</th>
                                    <th className="text-left py-3.5 px-4 hidden xl:table-cell">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.recentThreats.map((threat, i) => (
                                    <motion.tr
                                        key={threat.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.04 * i }}
                                        className="hover:bg-white/[0.04] transition-colors"
                                    >
                                        <td className="py-3.5 px-4 font-semibold text-gray-200">{threat.type}</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`severity-${threat.severity} font-bold uppercase text-xs tracking-wider px-2 py-0.5 rounded bg-white/[0.03] border border-white/5`}>
                                                {threat.severity}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-neon-cyan text-xs hidden md:table-cell">
                                            {threat.source_ip || '—'}
                                        </td>
                                        <td className="py-3.5 px-4 hidden lg:table-cell">
                                            {threat.mitre_id ? (
                                                <span className={`mitre-badge mitre-${threat.severity}`}>
                                                    {threat.mitre_id}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-400 text-xs hidden xl:table-cell max-w-xs truncate">
                                            {threat.description}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState message="No threats detected — upload log files to trigger automated parsing" />
                )}
            </motion.div>
        </div>
    );
}

function StatCard({ icon, label, value, color, accentColor, delay }) {
    const colorClasses = {
        'neon-cyan': 'text-neon-cyan bg-neon-cyan/15 border-neon-cyan/30 shadow-[0_0_20px_rgba(0,240,255,0.2)]',
        'neon-red': 'text-neon-red bg-neon-red/15 border-neon-red/30 shadow-[0_0_20px_rgba(255,46,147,0.2)]',
        'neon-orange': 'text-neon-orange bg-neon-orange/15 border-neon-orange/30 shadow-[0_0_20px_rgba(249,115,22,0.2)]',
        'neon-purple': 'text-neon-purple bg-neon-purple/15 border-neon-purple/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    };
    const cls = colorClasses[color] || colorClasses['neon-cyan'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="glass-card glass-card-hover p-5 relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${accentColor} rounded-bl-full opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none`} />
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
                    <p className="text-2xl lg:text-3xl font-extrabold font-mono text-white tracking-tight">{value}</p>
                </div>
                <div className={`p-3 rounded-xl border ${cls}`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}

function RiskBadge({ score }) {
    const color = score >= 75 ? 'text-neon-red bg-neon-red/15 border-neon-red/40 shadow-[0_0_8px_rgba(255,46,147,0.3)]'
        : score >= 50 ? 'text-neon-orange bg-neon-orange/15 border-neon-orange/40'
            : score >= 25 ? 'text-neon-yellow bg-neon-yellow/15 border-neon-yellow/40'
                : 'text-neon-green bg-neon-green/15 border-neon-green/40';

    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono border ${color}`}>
            RISK {score}
        </span>
    );
}

function EmptyState({ message }) {
    return (
        <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <Shield size={36} className="mb-2 opacity-25 text-neon-cyan" />
            <p className="text-xs font-mono text-center max-w-xs">{message}</p>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-cyber-card rounded-xl w-64" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-card p-5 h-28" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-card h-80" />
                <div className="glass-card h-80 lg:col-span-2" />
            </div>
        </div>
    );
}

function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}
