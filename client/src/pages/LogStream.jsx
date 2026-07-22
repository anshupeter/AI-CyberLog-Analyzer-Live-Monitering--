import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radio, Play, Square, Trash2, Pause,
    Wifi, WifiOff, AlertTriangle, Shield, ExternalLink, Server, Terminal, Filter
} from 'lucide-react';
import useWebSocket from '../hooks/useWebSocket';
import api from '../utils/api';

const SEVERITY_STYLES = {
    critical: 'text-neon-red font-semibold',
    error: 'text-neon-red',
    warning: 'text-neon-yellow',
    info: 'text-neon-sky',
};

export default function LogStream() {
    const { messages, isConnected, clearMessages } = useWebSocket();
    const [isSimulating, setIsSimulating] = useState(false);
    const [monitoring, setMonitoring] = useState(false);
    const [monitorPath, setMonitorPath] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [filter, setFilter] = useState('all');
    const terminalRef = useRef(null);
    const [liveThreats, setLiveThreats] = useState([]);
    const [pausedMessages, setPausedMessages] = useState(null);

    // Check initial stream status on mount
    useEffect(() => {
        Promise.all([
            api.get('/stream/status'),
            api.get('/live/status'),
        ])
            .then(([streamRes, liveRes]) => {
                setIsSimulating(streamRes.data.isSimulating);
                setMonitoring(Boolean(liveRes.data?.isActive));
                setMonitorPath(liveRes.data?.filePath || '');
            })
            .catch(() => { });
    }, []);

    // Snapshot messages when pausing
    const displayMessages = isPaused && pausedMessages ? pausedMessages : messages;

    // Get log and threat messages
    const logMessages = displayMessages.filter(m => m.type === 'log');
    const threatMessages = displayMessages.filter(m => m.type === 'threat');

    // Filter logs
    const filteredLogs = filter === 'all'
        ? logMessages
        : logMessages.filter(m => m.data?.severity === filter);

    // Auto scroll
    useEffect(() => {
        if (autoScroll && terminalRef.current && !isPaused) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [filteredLogs.length, autoScroll, isPaused]);

    // Track live threats
    useEffect(() => {
        const threats = messages.filter(m => m.type === 'threat').slice(-5);
        setLiveThreats(threats.map(t => t.data));
    }, [messages]);

    async function toggleSimulation() {
        try {
            if (isSimulating) {
                await api.post('/stream/stop');
                setIsSimulating(false);
            } else {
                await api.post('/stream/start');
                setIsSimulating(true);
            }
        } catch (e) {
            console.error('Simulation toggle error:', e);
        }
    }

    async function toggleMonitoring() {
        try {
            if (monitoring) {
                await api.post('/live/stop');
                setMonitoring(false);
            } else {
                const res = await api.post('/live/start');
                setMonitoring(Boolean(res.data?.isActive));
                setMonitorPath(res.data?.filePath || monitorPath);
            }
        } catch (e) {
            console.error('Live monitoring toggle error:', e);
        }
    }

    function handleScroll() {
        if (!terminalRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
        setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-cyber font-extrabold gradient-text flex items-center gap-3">
                        <Radio size={28} className={monitoring ? 'text-neon-cyan animate-pulse' : 'text-gray-500'} />
                        LIVE MONITORING & SIEM STREAM
                    </h1>
                    <p className="text-gray-400 text-xs lg:text-sm mt-1 font-mono">Real-time log tailing, automated parsing & WebSocket threat detection</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <a
                        href="http://localhost:5000/demo"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-white/[0.03] text-gray-300 border border-white/10 hover:text-neon-cyan hover:border-neon-cyan/40"
                    >
                        <ExternalLink size={14} />
                        Demo Web
                    </a>
                    <button
                        onClick={toggleMonitoring}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                            monitoring
                                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                                : 'bg-white/[0.03] text-gray-300 border border-white/10 hover:text-neon-cyan hover:border-neon-cyan/40'
                        }`}
                    >
                        <Server size={14} />
                        {monitoring ? 'Stop Monitor' : 'Start Monitor'}
                    </button>
                    <button
                        onClick={toggleSimulation}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isSimulating
                                ? 'bg-neon-red/20 text-neon-red border border-neon-red/40 shadow-[0_0_15px_rgba(255,46,147,0.2)]'
                                : 'bg-neon-green/20 text-neon-green border border-neon-green/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        }`}
                    >
                        {isSimulating ? <Square size={14} /> : <Play size={14} />}
                        {isSimulating ? 'Stop Traffic' : 'Start Sim Traffic'}
                    </button>
                    <button
                        onClick={() => {
                            if (!isPaused) {
                                setPausedMessages([...messages]);
                            } else {
                                setPausedMessages(null);
                            }
                            setIsPaused(!isPaused);
                        }}
                        className={`p-2 rounded-xl border transition-all ${
                            isPaused
                                ? 'bg-neon-yellow/20 text-neon-yellow border-neon-yellow/40'
                                : 'bg-white/[0.03] text-gray-400 border-white/10 hover:text-gray-200'
                        }`}
                        title={isPaused ? 'Resume' : 'Pause'}
                    >
                        {isPaused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                    <button
                        onClick={() => {
                            clearMessages();
                            setLiveThreats([]);
                            setPausedMessages(null);
                            setIsPaused(false);
                        }}
                        className="p-2 rounded-xl bg-white/[0.03] text-gray-400 border border-white/10 hover:text-neon-red hover:border-neon-red/40 transition-all"
                        title="Clear console"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Status Bar */}
            <div className="glass-card p-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-4">
                    <div className={`flex items-center gap-1.5 font-bold ${isConnected ? 'text-neon-green' : 'text-red-400'}`}>
                        {isConnected ? <Wifi size={13} className="animate-pulse" /> : <WifiOff size={13} />}
                        {isConnected ? 'WEBSOCKET CONNECTED' : 'DISCONNECTED'}
                    </div>
                    <div className="text-white/20">|</div>
                    <div className={`flex items-center gap-1.5 ${monitoring ? 'text-neon-cyan font-bold' : 'text-gray-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${monitoring ? 'bg-neon-cyan pulse-dot' : 'bg-gray-600'}`} />
                        {monitoring ? 'TAILING LIVE FILE' : 'MONITORING STANDBY'}
                    </div>
                    <div className="text-white/20">|</div>
                    <div className="text-gray-400">
                        Total Logs: <span className="text-white font-bold">{logMessages.length}</span>
                    </div>
                    <div className="text-white/20">|</div>
                    <div className="text-gray-400">
                        Threat Alerts: <span className="text-neon-red font-bold">{threatMessages.length}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={13} className="text-neon-cyan" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-cyber-card border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:border-neon-cyan focus:outline-none font-mono"
                    >
                        <option value="all">All Logs ({logMessages.length})</option>
                        <option value="critical">Critical</option>
                        <option value="error">Error</option>
                        <option value="warning">Warning</option>
                        <option value="info">Info</option>
                    </select>
                </div>
            </div>

            {/* Terminal Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Terminal Window */}
                <div className="lg:col-span-2 glass-card border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[560px] shadow-[0_15px_40px_rgba(0,0,0,0.7)] relative">
                    {/* Scanline overlay */}
                    <div className="scan-line pointer-events-none opacity-40 z-20" />

                    {/* Window Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#0a0f1d] border-b border-white/10 font-mono text-xs z-10">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            </div>
                            <Terminal size={14} className="ml-2 text-neon-cyan" />
                            <span className="text-gray-300 font-semibold tracking-wide">SOC-LIVE-LOGS.STREAM</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                            {isPaused && (
                                <span className="px-2 py-0.5 rounded bg-neon-yellow/20 text-neon-yellow font-bold text-[10px] animate-pulse">
                                    PAUSED
                                </span>
                            )}
                            <span className="text-[11px] text-gray-500">{filteredLogs.length} events</span>
                        </div>
                    </div>

                    {/* Terminal Body */}
                    <div
                        ref={terminalRef}
                        onScroll={handleScroll}
                        className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed bg-[#040711]/90 space-y-1.5"
                    >
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((msg, index) => {
                                const data = msg.data || {};
                                const raw = data.rawLog || data.message || JSON.stringify(data);
                                const timestamp = data.timestamp || new Date(msg.timestamp || Date.now()).toLocaleTimeString();
                                const severity = data.severity || 'info';

                                return (
                                    <div
                                        key={index}
                                        className="flex items-start gap-2.5 hover:bg-white/[0.03] py-0.5 px-1 rounded transition-colors group"
                                    >
                                        <span className="text-gray-500 select-none flex-shrink-0 text-[10px] pt-0.5 font-semibold">
                                            [{timestamp}]
                                        </span>
                                        <span className={`select-none uppercase font-bold text-[10px] px-1.5 py-0.2 rounded bg-white/[0.03] ${SEVERITY_STYLES[severity] || 'text-gray-400'}`}>
                                            {severity}
                                        </span>
                                        <span className="text-gray-300 break-all text-xs">
                                            {raw}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2">
                                <Radio size={32} className="opacity-20 animate-pulse text-neon-cyan" />
                                <p className="text-xs">Awaiting log events... Start Traffic Simulation or Live Monitor</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Threat Detection Feed */}
                <div className="glass-card p-5 border border-white/10 rounded-2xl flex flex-col h-[560px] overflow-hidden">
                    <h3 className="text-sm font-bold text-gray-200 tracking-wide mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <AlertTriangle size={16} className="text-neon-red" />
                            Live Threat Feed
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-neon-red/15 text-neon-red text-[10px] font-mono font-bold border border-neon-red/30">
                            REALTIME
                        </span>
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        <AnimatePresence>
                            {liveThreats.length > 0 ? (
                                liveThreats.map((threat, idx) => (
                                    <motion.div
                                        key={threat.id || idx}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="p-3.5 rounded-xl bg-neon-red/10 border border-neon-red/30 shadow-[0_0_15px_rgba(255,46,147,0.15)] space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs text-neon-red tracking-wide uppercase">
                                                🚨 {threat.type}
                                            </span>
                                            {threat.mitre_id && (
                                                <span className="mitre-badge mitre-critical">
                                                    {threat.mitre_id}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-300 font-mono">
                                            IP: <span className="text-neon-cyan font-bold">{threat.sourceIP || threat.source_ip || 'N/A'}</span>
                                        </p>

                                        <p className="text-[11px] text-gray-400 leading-snug">
                                            {threat.description}
                                        </p>

                                        <div className="text-[10px] font-mono text-gray-500 pt-1 border-t border-white/5 flex justify-between">
                                            <span>SEVERITY: {threat.severity?.toUpperCase()}</span>
                                            <span>JUST NOW</span>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center space-y-2">
                                    <Shield size={36} className="opacity-20 text-neon-cyan" />
                                    <p className="text-xs font-mono">No active threats detected in current stream batch</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
