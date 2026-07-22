import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Activity, Wifi, WifiOff, Zap, Bell } from 'lucide-react';
import api from '../utils/api';
import useWebSocket from '../hooks/useWebSocket';

export default function ThreatBar() {
    const [stats, setStats] = useState(null);
    const { isConnected, lastMessage } = useWebSocket();
    const [latestThreat, setLatestThreat] = useState(null);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 12000);
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
            // Server might still be booting up
        }
    }

    return (
        <div className="h-16 flex items-center justify-between gap-4 px-4 lg:px-8 border-b border-cyber-border bg-[#060913]/85 backdrop-blur-xl sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            {/* Left: Quick Metrics Pills */}
            <div className="flex items-center gap-3 lg:gap-6">
                <StatPill
                    icon={<Shield size={15} />}
                    label="Threats"
                    value={stats?.totalThreats || 0}
                    color="text-neon-red"
                    borderColor="border-neon-red/30"
                    bgColor="bg-neon-red/10"
                    glow="shadow-[0_0_12px_rgba(255,46,147,0.2)]"
                />
                <StatPill
                    icon={<AlertTriangle size={15} />}
                    label="Critical"
                    value={stats?.criticalThreats || 0}
                    color="text-neon-orange"
                    borderColor="border-neon-orange/30"
                    bgColor="bg-neon-orange/10"
                    className="hidden sm:flex"
                    glow="shadow-[0_0_12px_rgba(249,115,22,0.2)]"
                />
                <StatPill
                    icon={<Activity size={15} />}
                    label="Processed"
                    value={stats?.totalLogs ? formatNum(stats.totalLogs) : '0'}
                    color="text-neon-cyan"
                    borderColor="border-neon-cyan/30"
                    bgColor="bg-neon-cyan/10"
                    className="hidden md:flex"
                    glow="shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                />
            </div>

            {/* Center: Live Threat Alert Banner */}
            <AnimatePresence>
                {latestThreat && (
                    <motion.div
                        initial={{ opacity: 0, y: -12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.95 }}
                        className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-neon-red/15 border border-neon-red/40 shadow-[0_0_20px_rgba(255,46,147,0.3)] max-w-lg"
                    >
                        <Bell className="w-4 h-4 text-neon-red animate-bounce" />
                        <span className="text-xs text-neon-red font-mono font-semibold truncate tracking-wide">
                            CRITICAL DETECTED: {latestThreat.type} ({latestThreat.sourceIP})
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right: Live Connection Pill */}
            <div className="flex items-center gap-3">
                <motion.div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider font-mono ${
                        isConnected
                            ? 'bg-neon-green/15 text-neon-green border border-neon-green/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}
                    animate={isConnected ? { boxShadow: ['0 0 8px rgba(16,185,129,0.2)', '0 0 16px rgba(16,185,129,0.5)', '0 0 8px rgba(16,185,129,0.2)'] } : {}}
                    transition={{ duration: 2.5, repeat: Infinity }}
                >
                    {isConnected ? <Wifi size={13} className="animate-pulse" /> : <WifiOff size={13} />}
                    <span>{isConnected ? 'LIVE ENGINE' : 'DISCONNECTED'}</span>
                </motion.div>
            </div>
        </div>
    );
}

function StatPill({ icon, label, value, color, borderColor, bgColor, glow, className = '' }) {
    return (
        <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${borderColor} ${bgColor} ${glow} transition-all hover:scale-105 ${className}`}>
            <div className={`${color}`}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 font-mono tracking-widest uppercase leading-none">{label}</span>
                <span className={`text-xs font-bold ${color} font-mono leading-tight mt-0.5`}>{value}</span>
            </div>
        </div>
    );
}

function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}
