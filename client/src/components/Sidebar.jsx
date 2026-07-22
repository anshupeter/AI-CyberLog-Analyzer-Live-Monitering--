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
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            <motion.aside
                className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ${isExpanded ? 'w-[240px]' : 'w-[72px] lg:w-[240px]'
                    }`}
                style={{
                    background: 'linear-gradient(180deg, rgba(13, 19, 40, 0.95) 0%, rgba(10, 15, 31, 0.98) 100%)',
                    borderRight: '1px solid rgba(0, 240, 255, 0.1)',
                }}
            >
                {/* Header */}
                <div className="flex items-center h-16 px-4 border-b border-cyber-border">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <motion.div
                            className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center border border-neon-cyan/30"
                            whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}
                        >
                            <ShieldAlert className="w-5 h-5 text-neon-cyan" />
                        </motion.div>
                        <div className={`overflow-hidden ${isExpanded ? 'block' : 'hidden lg:block'}`}>
                            <h1 className="font-cyber text-sm font-bold gradient-text truncate">CyberGuard</h1>
                            <p className="text-[10px] text-gray-500 font-mono">SIEM Dashboard</p>
                        </div>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="lg:hidden flex-shrink-0 p-1 text-gray-400 hover:text-neon-cyan transition-colors"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            onClick={() => setIsExpanded(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive
                                    ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-neon-cyan rounded-r"
                                            transition={{ type: 'spring', bounce: 0.2 }}
                                        />
                                    )}
                                    <item.icon size={20} className="flex-shrink-0" />
                                    <span className={`text-sm font-medium truncate ${isExpanded ? 'block' : 'hidden lg:block'}`}>
                                        {item.label}
                                    </span>
                                    {/* Tooltip for collapsed state */}
                                    <span className="absolute left-full ml-2 px-2 py-1 bg-cyber-card rounded text-xs text-gray-300 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 lg:hidden transition-opacity z-50 border border-cyber-border">
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className={`p-4 border-t border-cyber-border ${isExpanded ? 'block' : 'hidden lg:block'}`}>
                    <div className="glass-card p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-neon-green pulse-dot" />
                            <span className="text-xs font-medium text-neon-green">System Active</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono">v1.0.0 — Blue Team SOC</p>
                    </div>
                </div>
            </motion.aside>
        </>
    );
}
