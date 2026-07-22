/**
 * AI Analyzer Module
 * Heuristic-based anomaly detection with natural-language threat summaries
 * No external AI API dependency — fully self-contained
 */

/**
 * Generate comprehensive AI analysis for a set of log entries and detected threats
 */
function analyzeSession(entries, threats) {
    const stats = computeStats(entries);
    const anomalies = detectAnomalies(entries, stats);
    const riskScore = calculateRiskScore(threats, anomalies, stats);
    const summary = generateSummary(stats, threats, anomalies, riskScore);

    return {
        riskScore,
        summary,
        stats,
        anomalies,
        threatBreakdown: getBreakdown(threats),
        ipReputation: computeIPReputation(entries, threats),
        timeline: buildTimeline(entries, threats),
    };
}

/**
 * Compute aggregate statistics from log entries
 */
function computeStats(entries) {
    const uniqueIPs = new Set();
    const methods = {};
    const statusCodes = {};
    const hourlyDistribution = {};
    let errorCount = 0;
    let warningCount = 0;

    for (const entry of entries) {
        if (entry.sourceIP) uniqueIPs.add(entry.sourceIP);
        if (entry.method) methods[entry.method] = (methods[entry.method] || 0) + 1;
        if (entry.statusCode) {
            statusCodes[entry.statusCode] = (statusCodes[entry.statusCode] || 0) + 1;
            if (entry.statusCode >= 500) errorCount++;
            if (entry.statusCode === 401 || entry.statusCode === 403) warningCount++;
        }

        try {
            const hour = new Date(entry.timestamp).getHours();
            if (!isNaN(hour)) {
                hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
            }
        } catch (e) { /* skip */ }
    }

    return {
        totalEntries: entries.length,
        uniqueIPs: uniqueIPs.size,
        ipList: Array.from(uniqueIPs),
        methods,
        statusCodes,
        errorCount,
        warningCount,
        hourlyDistribution,
    };
}

/**
 * Detect statistical anomalies in log patterns
 */
function detectAnomalies(entries, stats) {
    const anomalies = [];

    // Anomaly 1: High error rate
    const errorRate = stats.errorCount / Math.max(stats.totalEntries, 1);
    if (errorRate > 0.1) {
        anomalies.push({
            type: 'High Error Rate',
            severity: errorRate > 0.3 ? 'critical' : 'high',
            description: `Error rate is ${(errorRate * 100).toFixed(1)}% (${stats.errorCount} errors out of ${stats.totalEntries} entries) — significantly above normal threshold of 10%.`,
        });
    }

    // Anomaly 2: Concentrated traffic from single IP
    const ipCounts = {};
    for (const entry of entries) {
        if (entry.sourceIP) {
            ipCounts[entry.sourceIP] = (ipCounts[entry.sourceIP] || 0) + 1;
        }
    }

    for (const [ip, count] of Object.entries(ipCounts)) {
        const ratio = count / stats.totalEntries;
        if (ratio > 0.5 && count > 20) {
            anomalies.push({
                type: 'Traffic Concentration',
                severity: 'high',
                description: `IP ${ip} accounts for ${(ratio * 100).toFixed(1)}% of all traffic (${count} requests) — possible automated activity.`,
            });
        }
    }

    // Anomaly 3: Off-hours activity (between 2 AM - 5 AM)
    const offHoursEntries = entries.filter(e => {
        try {
            const hour = new Date(e.timestamp).getHours();
            return hour >= 2 && hour <= 5;
        } catch { return false; }
    });

    if (offHoursEntries.length > entries.length * 0.2 && offHoursEntries.length > 10) {
        anomalies.push({
            type: 'Off-Hours Activity',
            severity: 'medium',
            description: `${offHoursEntries.length} requests detected during off-hours (2 AM - 5 AM) — ${(offHoursEntries.length / entries.length * 100).toFixed(1)}% of total traffic.`,
        });
    }

    // Anomaly 4: Rapid burst detection
    const timestamps = entries
        .map(e => new Date(e.timestamp).getTime())
        .filter(t => !isNaN(t))
        .sort();

    if (timestamps.length > 10) {
        for (let i = 0; i < timestamps.length - 10; i++) {
            const windowSpan = (timestamps[i + 10] - timestamps[i]) / 1000;
            if (windowSpan < 1) {
                anomalies.push({
                    type: 'Request Burst',
                    severity: 'high',
                    description: `Detected burst of 10+ requests within 1 second — possible automated tool or attack.`,
                });
                break;
            }
        }
    }

    return anomalies;
}

/**
 * Calculate overall risk score (0-100)
 */
function calculateRiskScore(threats, anomalies, stats) {
    let score = 0;

    // Threat severity contribution
    for (const threat of threats) {
        switch (threat.severity) {
            case 'critical': score += 25; break;
            case 'high': score += 15; break;
            case 'medium': score += 8; break;
            case 'low': score += 3; break;
        }
    }

    // Anomaly contribution
    for (const anomaly of anomalies) {
        switch (anomaly.severity) {
            case 'critical': score += 15; break;
            case 'high': score += 10; break;
            case 'medium': score += 5; break;
        }
    }

    // Error rate contribution
    const errorRate = stats.errorCount / Math.max(stats.totalEntries, 1);
    score += Math.min(errorRate * 50, 15);

    return Math.min(Math.round(score), 100);
}

/**
 * Generate natural-language threat summary
 */
function generateSummary(stats, threats, anomalies, riskScore) {
    const lines = [];

    // Overall assessment
    const riskLevel = riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW';
    lines.push(`🔒 **Security Analysis Report** — Risk Level: **${riskLevel}** (Score: ${riskScore}/100)\n`);

    // Overview
    lines.push(`📊 **Overview**: Analyzed ${stats.totalEntries.toLocaleString()} log entries from ${stats.uniqueIPs} unique IP addresses. Found ${stats.errorCount} errors and ${stats.warningCount} authentication failures.\n`);

    // Threats
    if (threats.length > 0) {
        lines.push(`🚨 **${threats.length} Threat(s) Detected**:\n`);
        const criticalThreats = threats.filter(t => t.severity === 'critical');
        const highThreats = threats.filter(t => t.severity === 'high');
        const mediumThreats = threats.filter(t => t.severity === 'medium');

        if (criticalThreats.length > 0) {
            lines.push(`  🔴 **${criticalThreats.length} Critical**: ${criticalThreats.map(t => t.type).join(', ')}`);
        }
        if (highThreats.length > 0) {
            lines.push(`  🟠 **${highThreats.length} High**: ${highThreats.map(t => t.type).join(', ')}`);
        }
        if (mediumThreats.length > 0) {
            lines.push(`  🟡 **${mediumThreats.length} Medium**: ${mediumThreats.map(t => t.type).join(', ')}`);
        }

        lines.push('');

        // Specific threat details
        for (const threat of threats.slice(0, 5)) {
            lines.push(`  ⚡ ${threat.description}`);
        }
        if (threats.length > 5) {
            lines.push(`  ... and ${threats.length - 5} more threats detected.`);
        }
    } else {
        lines.push(`✅ **No active threats detected** — log patterns appear normal.\n`);
    }

    // Anomalies
    if (anomalies.length > 0) {
        lines.push(`\n🔍 **${anomalies.length} Anomaly/Anomalies Detected**:\n`);
        for (const anomaly of anomalies) {
            const icon = anomaly.severity === 'critical' ? '🔴' : anomaly.severity === 'high' ? '🟠' : '🟡';
            lines.push(`  ${icon} ${anomaly.description}`);
        }
    }

    // MITRE mapping summary
    const mitreIds = [...new Set(threats.map(t => t.mitreId).filter(Boolean))];
    if (mitreIds.length > 0) {
        lines.push(`\n🛡️ **MITRE ATT&CK Techniques Mapped**: ${mitreIds.join(', ')}`);
    }

    // Recommendations
    lines.push(`\n💡 **Recommendations**:`);
    if (riskScore >= 50) {
        lines.push(`  1. Immediately investigate flagged IP addresses`);
        lines.push(`  2. Consider blocking critical threat source IPs at firewall level`);
        lines.push(`  3. Review and harden authentication mechanisms`);
        lines.push(`  4. Enable enhanced logging and monitoring`);
    } else if (riskScore >= 25) {
        lines.push(`  1. Monitor flagged IPs for continued suspicious activity`);
        lines.push(`  2. Review access control policies`);
        lines.push(`  3. Consider implementing rate limiting`);
    } else {
        lines.push(`  1. Continue regular log monitoring`);
        lines.push(`  2. Maintain current security posture`);
    }

    return lines.join('\n');
}

/**
 * Get threat breakdown by type and severity
 */
function getBreakdown(threats) {
    const byType = {};
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const threat of threats) {
        byType[threat.type] = (byType[threat.type] || 0) + 1;
        bySeverity[threat.severity] = (bySeverity[threat.severity] || 0) + 1;
    }

    return { byType, bySeverity };
}

/**
 * Compute IP reputation scores based on behavior
 */
function computeIPReputation(entries, threats) {
    const ipScores = {};

    // Count per-IP stats
    for (const entry of entries) {
        if (!entry.sourceIP) continue;
        if (!ipScores[entry.sourceIP]) {
            ipScores[entry.sourceIP] = {
                ip: entry.sourceIP,
                totalRequests: 0,
                errors: 0,
                authFailures: 0,
                threatCount: 0,
                score: 100, // Start with clean reputation
            };
        }
        ipScores[entry.sourceIP].totalRequests++;
        if (entry.statusCode >= 500) ipScores[entry.sourceIP].errors++;
        if (entry.statusCode === 401 || entry.statusCode === 403) ipScores[entry.sourceIP].authFailures++;
    }

    // Factor in threats
    for (const threat of threats) {
        if (threat.sourceIP && ipScores[threat.sourceIP]) {
            ipScores[threat.sourceIP].threatCount++;
            switch (threat.severity) {
                case 'critical': ipScores[threat.sourceIP].score -= 40; break;
                case 'high': ipScores[threat.sourceIP].score -= 25; break;
                case 'medium': ipScores[threat.sourceIP].score -= 10; break;
            }
        }
    }

    // Normalize scores
    for (const ip of Object.keys(ipScores)) {
        ipScores[ip].score = Math.max(0, Math.min(100, ipScores[ip].score));
    }

    return Object.values(ipScores)
        .sort((a, b) => a.score - b.score)
        .slice(0, 20); // Top 20 IPs by reputation
}

/**
 * Build timeline of events for visualization
 */
function buildTimeline(entries, threats) {
    const timeline = {};

    for (const entry of entries) {
        try {
            const date = new Date(entry.timestamp);
            if (isNaN(date.getTime())) continue;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;

            if (!timeline[key]) {
                timeline[key] = { time: key, total: 0, errors: 0, threats: 0 };
            }
            timeline[key].total++;
            if (entry.severity === 'error' || entry.severity === 'critical') {
                timeline[key].errors++;
            }
        } catch (e) { /* skip */ }
    }

    for (const threat of threats) {
        try {
            const date = new Date(threat.created_at || new Date());
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
            if (timeline[key]) timeline[key].threats++;
        } catch (e) { /* skip */ }
    }

    return Object.values(timeline).sort((a, b) => a.time.localeCompare(b.time));
}

module.exports = {
    analyzeSession,
    computeStats,
    detectAnomalies,
    calculateRiskScore,
    generateSummary,
    computeIPReputation,
    buildTimeline,
};
