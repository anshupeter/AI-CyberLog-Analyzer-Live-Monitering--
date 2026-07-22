import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, ExternalLink, AlertTriangle, Info, Target,
    Loader2, ChevronRight, Lock, Crosshair, Eye, Zap, CheckCircle2, X
} from 'lucide-react';
import api from '../utils/api';

const TACTIC_ICONS = {
    'Credential Access': Lock,
    'Initial Access': Crosshair,
    'Impact': Zap,
    'Discovery': Eye,
    'Reconnaissance': Target,
    'Command and Control': Shield,
    'Execution': Zap,
    'Privilege Escalation': AlertTriangle,
    'Defense Evasion': Shield,
};

export default function MitreAttack() {
    const [allTechniques, setAllTechniques] = useState([]);
    const [detectedTechniques, setDetectedTechniques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTechnique, setSelectedTechnique] = useState(null);

    useEffect(() => {
        fetchMitre();
    }, []);

    async function fetchMitre() {
        try {
            const res = await api.get('/logs/mitre');
            setAllTechniques(res.data.allTechniques || []);
            setDetectedTechniques(res.data.detectedTechniques || []);
        } catch (e) {
            console.error('MITRE fetch error:', e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-3">
                <Loader2 size={36} className="animate-spin text-neon-cyan" />
                <p className="text-xs font-mono text-gray-400">Fetching MITRE ATT&CK Framework Mapping...</p>
            </div>
        );
    }

    // Group all techniques by tactic
    const byTactic = {};
    for (const tech of allTechniques) {
        if (!byTactic[tech.tactic]) byTactic[tech.tactic] = [];
        byTactic[tech.tactic].push(tech);
    }

    // Create a set of detected technique IDs for quick lookup
    const detectedIds = new Set(detectedTechniques.map(t => t.mitre_id));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-cyber font-extrabold gradient-text flex items-center gap-3">
                        <Shield size={28} className="text-neon-cyan" />
                        MITRE ATT&CK MATRIX MAPPING
                    </h1>
                    <p className="text-gray-400 text-xs lg:text-sm mt-1 font-mono">
                        Automated threat correlation against the official MITRE ATT&CK Knowledge Base
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-xl bg-neon-red/15 text-neon-red border border-neon-red/30 text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(255,46,147,0.2)]">
                        <AlertTriangle size={14} />
                        {detectedIds.size} ACTIVE DETECTIONS
                    </span>
                    <a
                        href="https://attack.mitre.org/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] text-gray-300 border border-white/10 hover:text-neon-cyan hover:border-neon-cyan/40 text-xs font-semibold transition-all"
                    >
                        <ExternalLink size={14} />
                        MITRE ATT&CK® Site
                    </a>
                </div>
            </div>

            {/* Matrix Grid by Tactic */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(byTactic).map(([tactic, techs], idx) => {
                    const IconComp = TACTIC_ICONS[tactic] || Shield;
                    const tacticDetectedCount = techs.filter(t => detectedIds.has(t.mitre_id)).length;

                    return (
                        <motion.div
                            key={tactic}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * idx }}
                            className="glass-card p-5 rounded-2xl flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
                                            <IconComp size={18} />
                                        </div>
                                        <h3 className="font-bold text-sm text-gray-200 tracking-wide">{tactic}</h3>
                                    </div>
                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                        tacticDetectedCount > 0
                                            ? 'bg-neon-red/15 text-neon-red border-neon-red/30 shadow-[0_0_8px_rgba(255,46,147,0.3)]'
                                            : 'bg-white/5 text-gray-400 border-white/10'
                                    }`}>
                                        {tacticDetectedCount} DETECTED
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {techs.map((tech) => {
                                        const isDetected = detectedIds.has(tech.mitre_id);
                                        return (
                                            <button
                                                key={tech.mitre_id}
                                                onClick={() => setSelectedTechnique(tech)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between group ${
                                                    isDetected
                                                        ? 'bg-neon-red/10 border-neon-red/30 hover:border-neon-red text-gray-100 shadow-[0_0_12px_rgba(255,46,147,0.15)]'
                                                        : 'bg-white/[0.02] border-white/5 hover:border-neon-cyan/30 text-gray-400 hover:text-gray-200'
                                                }`}
                                            >
                                                <div className="min-w-0 mr-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs font-bold text-neon-cyan">
                                                            {tech.mitre_id}
                                                        </span>
                                                        <span className="text-xs font-semibold truncate group-hover:text-neon-cyan transition-colors">
                                                            {tech.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                                        {tech.description}
                                                    </p>
                                                </div>

                                                {isDetected ? (
                                                    <span className="mitre-badge mitre-critical flex-shrink-0">
                                                        ACTIVE
                                                    </span>
                                                ) : (
                                                    <ChevronRight size={14} className="text-gray-600 group-hover:text-neon-cyan transition-colors flex-shrink-0 mt-1" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Technique Detail Modal */}
            <AnimatePresence>
                {selectedTechnique && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card p-6 lg:p-8 max-w-xl w-full rounded-2xl border border-neon-cyan/40 shadow-[0_0_50px_rgba(0,240,255,0.2)] space-y-5 relative overflow-hidden"
                        >
                            <button
                                onClick={() => setSelectedTechnique(null)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-lg bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40 font-mono text-xs font-bold">
                                    {selectedTechnique.mitre_id}
                                </span>
                                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                                    TACTIC: {selectedTechnique.tactic}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-100">{selectedTechnique.name}</h3>

                            <div className="p-4 rounded-xl bg-[#040711] border border-white/5 space-y-2">
                                <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Technique Overview</p>
                                <p className="text-xs lg:text-sm text-gray-300 leading-relaxed font-sans">
                                    {selectedTechnique.description}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <a
                                    href={`https://attack.mitre.org/techniques/${selectedTechnique.mitre_id}/`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 text-xs font-bold hover:bg-neon-cyan/30 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                                >
                                    View on MITRE ATT&CK <ExternalLink size={14} />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
