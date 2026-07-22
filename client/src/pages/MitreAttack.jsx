import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield, ExternalLink, AlertTriangle, Info, Target,
    Loader2, ChevronRight, Lock, Crosshair, Eye, Zap,
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

const TACTIC_COLORS = {
    'Credential Access': 'neon-red',
    'Initial Access': 'neon-orange',
    'Impact': 'neon-pink',
    'Discovery': 'neon-cyan',
    'Reconnaissance': 'neon-blue',
    'Command and Control': 'neon-purple',
    'Execution': 'neon-yellow',
    'Privilege Escalation': 'neon-red',
    'Defense Evasion': 'neon-green',
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
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 size={32} className="animate-spin text-neon-cyan" />
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
            <div>
                <h1 className="text-2xl lg:text-3xl font-cyber font-bold gradient-text flex items-center gap-3">
                    <Shield size={28} className="text-neon-cyan" />
                    MITRE ATT&CK
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Threat mapping to MITRE ATT&CK framework techniques
                </p>
            </div>

            {/* Detection Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Target size={14} className="text-neon-red" />
                        Detected Techniques ({detectedTechniques.length})
                    </h3>
                    <a
                        href="https://attack.mitre.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-neon-cyan hover:underline"
                    >
                        MITRE ATT&CK Framework <ExternalLink size={10} />
                    </a>
                </div>

                {detectedTechniques.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {detectedTechniques.map((tech, i) => (
                            <motion.button
                                key={tech.mitre_id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.05 * i }}
                                onClick={() => setSelectedTechnique(
                                    selectedTechnique?.mitre_id === tech.mitre_id ? null : tech
                                )}
                                className={`mitre-badge mitre-${tech.severity} cursor-pointer ${selectedTechnique?.mitre_id === tech.mitre_id ? 'ring-1 ring-current' : ''
                                    }`}
                            >
                                <AlertTriangle size={10} />
                                {tech.mitre_id}
                                <span className="opacity-70">×{tech.detection_count}</span>
                            </motion.button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-gray-600">
                        <Shield size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No techniques detected yet — upload logs to begin analysis</p>
                    </div>
                )}

                {/* Selected technique detail */}
                {selectedTechnique && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-4 rounded-lg bg-white/[0.02] border border-cyber-border"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-300">
                                {selectedTechnique.mitre_id} — {selectedTechnique.mitre_name}
                            </h4>
                            <span className={`severity-${selectedTechnique.severity} text-xs uppercase font-bold`}>
                                {selectedTechnique.severity}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">Tactic: {selectedTechnique.mitre_tactic}</p>
                        <p className="text-sm text-gray-500">Detections: {selectedTechnique.detection_count}</p>
                    </motion.div>
                )}
            </motion.div>

            {/* Technique Matrix by Tactic */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(byTactic).map(([tactic, techniques], i) => {
                    const colorName = TACTIC_COLORS[tactic] || 'neon-cyan';
                    const IconComponent = TACTIC_ICONS[tactic] || Shield;
                    const hasDetections = techniques.some(t => detectedIds.has(t.id));

                    return (
                        <motion.div
                            key={tactic}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className={`glass-card p-5 ${hasDetections ? 'border-neon-red/20' : ''}`}
                        >
                            <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 text-${colorName}`}>
                                <IconComponent size={14} />
                                {tactic}
                                {hasDetections && (
                                    <span className="ml-auto w-2 h-2 rounded-full bg-neon-red pulse-dot" />
                                )}
                            </h3>

                            <div className="space-y-2">
                                {techniques.map((tech) => {
                                    const isDetected = detectedIds.has(tech.id);
                                    const detectionData = isDetected
                                        ? detectedTechniques.find(d => d.mitre_id === tech.id)
                                        : null;

                                    return (
                                        <div
                                            key={tech.id}
                                            className={`group relative p-2.5 rounded-lg text-xs transition-all ${isDetected
                                                    ? 'bg-neon-red/5 border border-neon-red/20 hover:bg-neon-red/10'
                                                    : 'bg-white/[0.02] border border-transparent hover:border-cyber-border hover:bg-white/[0.04]'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {isDetected && <div className="w-1.5 h-1.5 rounded-full bg-neon-red" />}
                                                    <span className={`font-mono font-bold ${isDetected ? 'text-neon-red' : 'text-gray-500'}`}>
                                                        {tech.id}
                                                    </span>
                                                    <span className={`${isDetected ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        {tech.name}
                                                    </span>
                                                </div>
                                                {isDetected && detectionData && (
                                                    <span className="text-neon-red font-mono">×{detectionData.detection_count}</span>
                                                )}
                                            </div>

                                            {/* Tooltip on hover */}
                                            <div className="invisible group-hover:visible absolute left-0 bottom-full mb-2 z-20 w-64 p-3 rounded-lg bg-cyber-card border border-cyber-border shadow-glass">
                                                <p className="text-xs font-medium text-gray-300 mb-1">{tech.name}</p>
                                                <p className="text-[10px] text-gray-500 leading-relaxed">{tech.description}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`mitre-badge mitre-${tech.severity} text-[10px]`}>
                                                        {tech.severity}
                                                    </span>
                                                    {tech.url && (
                                                        <a
                                                            href={tech.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] text-neon-cyan hover:underline flex items-center gap-0.5"
                                                        >
                                                            View <ExternalLink size={8} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-5"
            >
                <div className="flex items-start gap-3">
                    <Info size={16} className="text-neon-cyan flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-500">
                        <p className="font-medium text-gray-400 mb-1">About MITRE ATT&CK Mapping</p>
                        <p className="text-xs leading-relaxed">
                            MITRE ATT&CK is a globally-accessible knowledge base of adversary tactics and techniques based on real-world observations.
                            This dashboard automatically maps detected threats to the appropriate ATT&CK techniques, helping security analysts understand
                            the nature and severity of identified threats in context of known attack patterns.
                            Techniques highlighted in red have been detected in your analyzed logs.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
