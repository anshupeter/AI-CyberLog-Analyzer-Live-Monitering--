import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Radio, Play, Square, Trash2, Pause, ChevronDown,
    Wifi, WifiOff, AlertTriangle, Shield, ExternalLink, Server,
} from 'lucide-react';
import useWebSocket from '../hooks/useWebSocket';
import api from '../utils/api';

const SEVERITY_STYLES = {
    critical: 'text-red-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-gray-500',
};

export default function LogStream() {
    const { messages, isConnected, sendMessage, clearMessages } = useWebSocket();
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-cyber font-bold gradient-text flex items-center gap-3">
                        <Radio size={28} className={monitoring ? 'text-neon-cyan animate-pulse' : 'text-gray-500'} />
                        Live Monitoring / Live Detection
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time file watching with automatic detection on newly appended log entries</p>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href="http://localhost:5000/demo"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white/5 text-gray-300 border border-cyber-border hover:text-neon-cyan hover:border-neon-cyan/20"
                    >
                        <ExternalLink size={14} />
                        Open Demo Website
                    </a>
                    <button
                        onClick={toggleMonitoring}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${monitoring
                            ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20'
                            : 'bg-white/5 text-gray-300 border border-cyber-border hover:text-neon-cyan hover:border-neon-cyan/20'
                            }`}
                    >
                        <Server size={14} />
                        {monitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                    </button>
                    <button
                        onClick={toggleSimulation}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSimulating
                            ? 'bg-neon-red/10 text-neon-red border border-neon-red/20 hover:bg-neon-red/20'
                            : 'bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20'
                            }`}
                    >
                        {isSimulating ? <Square size={14} /> : <Play size={14} />}
                        {isSimulating ? 'Stop Stream' : 'Start Stream'}
                    </button>
                    <button
                        onClick={() => {
                            if (!isPaused) {
                                // Freeze: snapshot current messages
                                setPausedMessages([...messages]);
                            } else {
                                // Unfreeze: discard snapshot
                                setPausedMessages(null);
                            }
                            setIsPaused(!isPaused);
                        }}
                        className={`p-2 rounded-lg border transition-all ${isPaused
                            ? 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20'
                            : 'bg-white/5 text-gray-400 border-cyber-border hover:text-gray-200'
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
                        className="p-2 rounded-lg bg-white/5 text-gray-400 border border-cyber-border hover:text-neon-red transition-all"
                        title="Clear"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center gap-4 text-xs font-mono">
                <div className={`flex items-center gap-1.5 ${isConnected ? 'text-neon-green' : 'text-red-400'}`}>
                    {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </div>
                <div className="text-gray-600">|</div>
                <div className={`flex items-center gap-1.5 ${monitoring ? 'text-neon-cyan' : 'text-gray-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${monitoring ? 'bg-neon-cyan pulse-dot' : 'bg-gray-600'}`} />
                    {monitoring ? 'LIVE MONITORING ON' : 'LIVE MONITORING OFF'}
                </div>
                <div className="text-gray-600">|</div>
                <div className="text-gray-500">
                    Events: <span className="text-gray-300">{logMessages.length}</span>
                </div>
                <div className="text-gray-600">|</div>
                <div className="text-gray-500">
                    Threats: <span className="text-neon-red">{threatMessages.length}</span>
                </div>
                <div className="text-gray-600">|</div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-transparent border border-cyber-border rounded px-2 py-0.5 text-gray-400 focus:outline-none focus:border-neon-cyan/30"
                >
                    <option value="all">All Levels</option>
                    <option value="critical">Critical</option>
                    <option value="error">Error</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Terminal */}
                <div className="lg:col-span-3 glass-card overflow-hidden relative">
                    {/* Terminal header */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-cyber-border bg-black/30">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/70" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                            <div className="w-3 h-3 rounded-full bg-green-500/70" />
                        </div>
                        <span className="text-xs text-gray-500 font-mono ml-2">cyberguard@siem — live_feed</span>
                        {monitoring && (
                            <div className="ml-auto flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-neon-green pulse-dot" />
                                <span className="text-xs text-neon-cyan font-mono">WATCHING {monitorPath ? monitorPath.split('\\').pop() : 'live log'}</span>
                            </div>
                        )}
                    </div>

                    {/* Terminal body */}
                    <div
                        ref={terminalRef}
                        onScroll={handleScroll}
                        className="h-[500px] lg:h-[600px] overflow-y-auto p-4 font-mono text-xs leading-relaxed bg-[#080c18]"
                    >
                        {filteredLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-600">
                                <Radio size={48} className="mb-4 opacity-20" />
                                <p className="text-sm">No log events yet</p>
                                <p className="text-xs mt-1">Use the demo website or attack simulator to append logs, then start live monitoring</p>
                            </div>
                        ) : (
                            filteredLogs.map((msg, i) => {

                                const entry = msg.data;
                                const time = new Date(entry.timestamp).toLocaleTimeString();
                                const sevStyle = SEVERITY_STYLES[entry.severity] || 'text-gray-500';

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="hover:bg-white/[0.02] px-1 py-0.5 rounded"
                                    >
                                        <span className="text-gray-600">[{time}]</span>{' '}
                                        <span className={`uppercase font-bold ${sevStyle}`}>
                                            [{entry.severity?.padEnd(8) || 'info    '}]
                                        </span>{' '}
                                        {entry.sourceIP && (
                                            <span className="text-neon-purple">{entry.sourceIP}</span>
                                        )}{' '}
                                        {entry.method && (
                                            <span className="text-neon-cyan">{entry.method}</span>
                                        )}{' '}
                                        {entry.path && (
                                            <span className="text-gray-400">{entry.path}</span>
                                        )}{' '}
                                        {entry.statusCode && (
                                            <span className={entry.statusCode >= 400 ? 'text-red-400' : 'text-neon-green'}>
                                                {entry.statusCode}
                                            </span>
                                        )}{' '}
                                        <span className="text-gray-600">{entry.message}</span>
                                    </motion.div>
                                );
                            })
                        )}

                        {!autoScroll && filteredLogs.length > 0 && (
                            <button
                                onClick={() => {
                                    setAutoScroll(true);
                                    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
                                }}
                                className="sticky bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-neon-cyan/20 text-neon-cyan text-xs border border-neon-cyan/30"
                            >
                                <ChevronDown size={12} />
                                Scroll to bottom
                            </button>
                        )}
                    </div>
                </div>

                {/* Live Threats Panel */}
                <div className="glass-card p-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <Shield size={14} className="text-neon-red" />
                        Live Detections
                    </h3>

                    <div className="space-y-3">
                        {liveThreats.length > 0 ? (
                            liveThreats.map((threat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 rounded-lg bg-neon-red/5 border border-neon-red/10"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle size={12} className="text-neon-red" />
                                        <span className={`text-xs font-bold severity-${threat.severity}`}>
                                            {threat.severity?.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">{threat.type}</p>
                                    <p className="text-[10px] text-gray-600 mt-1 font-mono">{threat.sourceIP}</p>
                                    {threat.mitreId && (
                                        <span className={`mitre-badge mitre-${threat.severity} mt-2 text-[10px]`}>
                                            {threat.mitreId}
                                        </span>
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-600">
                                <Shield size={24} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">No live threats</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
