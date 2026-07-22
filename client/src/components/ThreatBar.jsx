import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Activity, Wifi, WifiOff } from 'lucide-react';
import api from '../utils/api';
import useWebSocket from '../hooks/useWebSocket';

export default function ThreatBar() {
    const [stats, setStats] = useState(null);
    const { isConnected, lastMessage } = useWebSocket();
    const [latestThreat, setLatestThreat] = useState(null);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (lastMessage?.type === 'threat') {
            setLatestThreat(lastMessage.data);
            setTimeout(() => setLatestThreat(null), 8000);
        }
        if (lastMessage?.type === 'analysis_complete') {
            fetchStats();
        }
    }, [lastMessage]);

    async function fetchStats() {
        try {
            const res = await api.get('/logs/stats');
            setStats(res.data);
        } catch (e) {
            // Backend might not be ready yet
        }
    }

    return (
        <div className="h-14 flex items-center gap-4 px-4 lg:px-6 border-b border-cyber-border bg-cyber-bg/80 backdrop-blur-lg sticky top-0 z-30">
            {/* Left: Stats */}
            <div className="flex items-center gap-4 lg:gap-6 flex-1">
                <StatPill
                    icon={<Shield size={14} />}
                    label="Threats"
                    value={stats?.totalThreats || 0}
                    color="text-neon-red"
                    bgColor="bg-neon-red/10"
                />
                <StatPill
                    icon={<AlertTriangle size={14} />}
                    label="Critical"
                    value={stats?.criticalThreats || 0}
                    color="text-neon-orange"
                    bgColor="bg-neon-orange/10"
                    className="hidden sm:flex"
                />
                <StatPill
                    icon={<Activity size={14} />}
                    label="Logs"
                    value={stats?.totalLogs ? formatNum(stats.totalLogs) : '0'}
                    color="text-neon-cyan"
                    bgColor="bg-neon-cyan/10"
                    className="hidden md:flex"
                />
            </div>

            {/* Center: Live threat alert */}
            <AnimatePresence>
                {latestThreat && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-red/10 border border-neon-red/30 max-w-md"
                    >
                        <div className="w-2 h-2 rounded-full bg-neon-red pulse-dot" />
                        <span className="text-xs text-neon-red font-mono truncate">
                            🚨 {latestThreat.type}: {latestThreat.sourceIP}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right: Connection status */}
            <div className="flex items-center gap-2">
                <motion.div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isConnected
                            ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                    animate={isConnected ? { opacity: [1, 0.7, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                    <span className="hidden sm:inline">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
                </motion.div>
            </div>
        </div>
    );
}

function StatPill({ icon, label, value, color, bgColor, className = '' }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${bgColor} ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-none">{label}</p>
                <p className={`text-sm font-bold ${color} font-mono leading-tight`}>{value}</p>
            </div>
        </div>
    );
}

function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}
