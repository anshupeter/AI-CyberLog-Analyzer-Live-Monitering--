import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
    Shield, AlertTriangle, Server, Globe, TrendingUp, Clock,
    FileWarning, Eye, ArrowUpRight, Zap, Activity, Trash2
} from 'lucide-react';
import api from '../utils/api';

const SEVERITY_COLORS = {
    critical: '#EF4444',
    high: '#F97316',
    medium: '#F59E0B',
    low: '#10B981',
    info: '#64748b',
};

const PIE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981'];

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
                    <h1 className="text-2xl lg:text-3xl font-cyber font-bold gradient-text">
                        Security Dashboard
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time threat intelligence overview</p>
                </div>
                <Link
                    to="/upload"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 transition-all text-sm font-medium"
                >
                    <Zap size={16} />
                    Analyze Logs
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Server size={20} />}
                    label="Total Logs"
                    value={formatNum(stats?.totalLogs || 0)}
                    color="neon-cyan"
                    delay={0}
                />
                <StatCard
                    icon={<Shield size={20} />}
                    label="Threats Detected"
                    value={stats?.totalThreats || 0}
                    color="neon-red"
                    delay={0.1}
                />
                <StatCard
                    icon={<AlertTriangle size={20} />}
                    label="Critical Threats"
                    value={stats?.criticalThreats || 0}
                    color="neon-orange"
                    delay={0.2}
                />
                <StatCard
                    icon={<Globe size={20} />}
                    label="Unique IPs"
                    value={stats?.uniqueIPs || 0}
                    color="neon-purple"
                    delay={0.3}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Threat Severity Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-4"
                >
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-neon-red pulse-dot" />
                        Threat Severity
                    </h3>
                    {severityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={severityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={100}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {severityData.map((_, index) => (
                                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                                    labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message="No threat data yet" />
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                        {severityData.map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                {item.name}: {item.value}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* IP Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-4 lg:col-span-2"
                >
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                        <Globe size={14} className="text-neon-purple" />
                        Top IP Activity
                    </h3>
                    {ipData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={ipData} barSize={24} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="ip" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#1e293b' }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#1e293b' }} />
                                <Tooltip
                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                                    labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                                />
                                <Bar dataKey="requests" fill="#A855F7" radius={[4, 4, 0, 0]}>
                                    {ipData.map((_, index) => (
                                        <Cell key={index} fill={`hsl(${270 + index * 15}, 70%, 60%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message="Upload logs to see IP activity" />
                    )}
                </motion.div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Threat Types */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-4 flex flex-col"
                    style={{ minHeight: '380px' }}
                >
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <FileWarning size={14} className="text-neon-yellow" />
                        Threat Breakdown
                    </h3>
                    {threatTypeData.length > 0 ? (
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={threatTypeData} layout="vertical" barSize={28} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#1e293b' }} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={140} axisLine={{ stroke: '#1e293b' }} />
                                    <Tooltip
                                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                                        itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                                        labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                                    />
                                    <Bar dataKey="count" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyState message="No threats detected yet" />
                    )}
                </motion.div>

                {/* Risk Score / Sessions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-5"
                >
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                        <Activity size={14} className="text-neon-cyan" />
                        Recent Analysis Sessions
                    </h3>
                    {stats?.recentSessions?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentSessions.map((session) => (
                                <Link
                                    key={session.id}
                                    to={`/analysis/${session.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-neon-cyan/20 transition-all group"
                                >
                                    <div className="flex-1 min-w-0 mr-3">
                                        <p className="text-sm font-medium text-gray-300 truncate">
                                            {session.filename}
                                        </p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                                            {session.total_lines} lines · {session.threat_count} threats
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <RiskBadge score={session.risk_score} />
                                        <button
                                            onClick={(e) => deleteSession(e, session.id, session.filename)}
                                            className="p-1.5 rounded-md text-gray-600 hover:text-neon-red hover:bg-neon-red/10 transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete session"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                        <ArrowUpRight size={14} className="text-gray-600 group-hover:text-neon-cyan transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="No analysis sessions yet — upload a log file to start" />
                    )}
                </motion.div>
            </div>

            {/* Recent Threats Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card p-5"
            >
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <Eye size={14} className="text-neon-red" />
                    Recent Threats
                </h3>
                {stats?.recentThreats?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-cyber-border">
                                    <th className="text-left py-3 px-3">Type</th>
                                    <th className="text-left py-3 px-3">Severity</th>
                                    <th className="text-left py-3 px-3 hidden md:table-cell">Source IP</th>
                                    <th className="text-left py-3 px-3 hidden lg:table-cell">MITRE ID</th>
                                    <th className="text-left py-3 px-3 hidden xl:table-cell">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentThreats.map((threat, i) => (
                                    <motion.tr
                                        key={threat.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * i }}
                                        className="border-b border-cyber-border/50 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="py-3 px-3 font-medium text-gray-300">{threat.type}</td>
                                        <td className="py-3 px-3">
                                            <span className={`severity-${threat.severity} font-semibold uppercase text-xs`}>
                                                {threat.severity}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 font-mono text-gray-400 hidden md:table-cell">
                                            {threat.source_ip || '—'}
                                        </td>
                                        <td className="py-3 px-3 hidden lg:table-cell">
                                            {threat.mitre_id ? (
                                                <span className={`mitre-badge mitre-${threat.severity}`}>
                                                    {threat.mitre_id}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="py-3 px-3 text-gray-500 text-xs hidden xl:table-cell max-w-xs truncate">
                                            {threat.description}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState message="No threats to display — upload and analyze log files to populate this table" />
                )}
            </motion.div>
        </div>
    );
}

function StatCard({ icon, label, value, color, delay }) {
    const colorClasses = {
        'neon-cyan': 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20 shadow-neon-cyan',
        'neon-red': 'text-neon-red bg-neon-red/10 border-neon-red/20 shadow-neon-red',
        'neon-orange': 'text-neon-orange bg-neon-orange/10 border-neon-orange/20',
        'neon-purple': 'text-neon-purple bg-neon-purple/10 border-neon-purple/20 shadow-neon-purple',
        'neon-green': 'text-neon-green bg-neon-green/10 border-neon-green/20 shadow-neon-green',
    };
    const cls = colorClasses[color] || colorClasses['neon-cyan'];
    const textColor = `text-${color}`;
    const bgColor = `bg-${color}/10`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="glass-card glass-card-hover p-4 relative overflow-hidden"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-2xl lg:text-3xl font-bold font-mono ${textColor}`}>{value}</p>
                </div>
                <div className={`p-2 rounded-lg ${bgColor} ${textColor}`}>
                    {icon}
                </div>
            </div>
            {/* Subtle glow effect */}
            <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full ${bgColor} blur-2xl opacity-50`} />
        </motion.div>
    );
}

function RiskBadge({ score }) {
    const color = score >= 75 ? 'text-neon-red bg-neon-red/10 border-neon-red/30'
        : score >= 50 ? 'text-neon-orange bg-neon-orange/10 border-neon-orange/30'
            : score >= 25 ? 'text-neon-yellow bg-neon-yellow/10 border-neon-yellow/30'
                : 'text-neon-green bg-neon-green/10 border-neon-green/30';

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${color}`}>
            {score}
        </span>
    );
}

function EmptyState({ message }) {
    return (
        <div className="flex flex-col items-center justify-center h-[200px] text-gray-600">
            <Shield size={32} className="mb-2 opacity-30" />
            <p className="text-sm text-center">{message}</p>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-cyber-card rounded w-64" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-card p-4 h-24" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="glass-card h-72" />
                <div className="glass-card h-72 lg:col-span-2" />
            </div>
        </div>
    );
}

function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}
