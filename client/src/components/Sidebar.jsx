import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Upload,
    Radio,
    BrainCircuit,
    Shield,
    Menu,
    X,
    ShieldAlert,
    Activity
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/upload', icon: Upload, label: 'Upload Logs' },
    { path: '/stream', icon: Radio, label: 'Live Monitoring' },
    { path: '/analysis', icon: BrainCircuit, label: 'AI Analysis' },
    { path: '/mitre', icon: Shield, label: 'MITRE ATT&CK' },
];

export default function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            {/* Mobile overlay */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            <motion.aside
                className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ${
                    isExpanded ? 'w-[240px]' : 'w-[72px] lg:w-[240px]'
                }`}
                style={{
                    background: 'linear-gradient(180deg, rgba(11, 17, 32, 0.92) 0%, rgba(6, 9, 19, 0.96) 100%)',
                    backdropFilter: 'blur(24px)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '10px 0 30px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Header */}
                <div className="flex items-center h-16 px-4 border-b border-cyber-border">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <motion.div
                            className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 via-neon-purple/20 to-neon-blue/20 flex items-center justify-center border border-neon-cyan/40 shadow-neon-cyan"
                            whileHover={{ scale: 1.08, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ShieldAlert className="w-5 h-5 text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                        </motion.div>
                        <div className={`overflow-hidden ${isExpanded ? 'block' : 'hidden lg:block'}`}>
                            <h1 className="font-cyber text-base font-extrabold tracking-wider gradient-text truncate">
                                CYBERGUARD
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                                <p className="text-[10px] text-neon-cyan/80 font-mono tracking-widest uppercase">SOC ENGINE</p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="lg:hidden flex-shrink-0 p-1.5 text-gray-400 hover:text-neon-cyan transition-colors rounded-lg hover:bg-white/5"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1.5">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            onClick={() => setIsExpanded(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 group relative ${
                                    isActive
                                        ? 'bg-gradient-to-r from-neon-cyan/15 to-neon-purple/10 text-neon-cyan border border-neon-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-semibold'
                                        : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-neon-cyan to-neon-purple rounded-r-full shadow-[0_0_10px_rgba(0,240,255,0.8)]"
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <item.icon size={20} className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : ''}`} />
                                    <span className={`text-sm tracking-wide truncate ${isExpanded ? 'block' : 'hidden lg:block'}`}>
                                        {item.label}
                                    </span>
                                    {/* Tooltip for collapsed mobile view */}
                                    <span className="absolute left-full ml-3 px-3 py-1.5 bg-cyber-card rounded-lg text-xs text-gray-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 lg:hidden transition-opacity z-50 border border-cyber-border shadow-xl">
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className={`p-4 border-t border-cyber-border ${isExpanded ? 'block' : 'hidden lg:block'}`}>
                    <div className="glass-card p-3.5 rounded-xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-neon-cyan/5 rounded-full blur-xl group-hover:bg-neon-cyan/15 transition-all" />
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-neon-green pulse-dot shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <span className="text-xs font-semibold text-neon-green tracking-wide">SIEM ACTIVE</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono flex items-center justify-between">
                            <span>v1.2.0</span>
                            <span className="text-neon-cyan/70">LIVE DEPLOYED</span>
                        </p>
                    </div>
                </div>
            </motion.aside>
        </>
    );
}
