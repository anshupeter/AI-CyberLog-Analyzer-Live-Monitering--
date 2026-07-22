/**
 * Detection Engine
 * Blue-team threat detection with MITRE ATT&CK mapping
 */

const { isAuthFailure, isSuspiciousURL } = require('./logParser');

// Detection thresholds
const THRESHOLDS = {
    BRUTE_FORCE_COUNT: 5,
    BRUTE_FORCE_WINDOW_SEC: 60,
    DDOS_REQUEST_COUNT: 100,
    DDOS_WINDOW_SEC: 60,
    SCAN_UNIQUE_PATHS: 20,
    SCAN_WINDOW_SEC: 30,
    RAPID_REQUESTS: 50,
    RAPID_WINDOW_SEC: 10,
};

/**
 * Run all detection rules against parsed log entries
 * @param {Array} entries - Normalized log entries
 * @returns {Array} Detected threats
 */
function runDetection(entries) {
    if (!entries || entries.length === 0) return [];

    const threats = [];

    threats.push(...detectBruteForce(entries));
    threats.push(...detectDDoS(entries));
    threats.push(...detectExploitAttempts(entries));
    threats.push(...detectPortScanning(entries));
    threats.push(...detectSuspiciousStatusCodes(entries));
    threats.push(...detectAnomalousPatterns(entries));
    threats.push(...detectUnauthorizedAccess(entries));

    return threats;
}

/**
 * Detect brute force attacks: >5 failed logins from same IP within 60 seconds
 * Maps to MITRE ATT&CK T1110 (Brute Force)
 */
function detectBruteForce(entries) {
    const threats = [];
    const failedByIP = {};

    for (const entry of entries) {
        if (!isAuthFailure(entry) || !entry.sourceIP) continue;

        if (!failedByIP[entry.sourceIP]) {
            failedByIP[entry.sourceIP] = [];
        }
        failedByIP[entry.sourceIP].push(entry);
    }

    for (const [ip, failures] of Object.entries(failedByIP)) {
        if (failures.length >= THRESHOLDS.BRUTE_FORCE_COUNT) {
            // Check if within time window
            const times = failures
                .map(f => new Date(f.timestamp).getTime())
                .filter(t => !isNaN(t))
                .sort();

            let inWindow = false;
            if (times.length >= THRESHOLDS.BRUTE_FORCE_COUNT) {
                for (let i = 0; i <= times.length - THRESHOLDS.BRUTE_FORCE_COUNT; i++) {
                    if ((times[i + THRESHOLDS.BRUTE_FORCE_COUNT - 1] - times[i]) / 1000 <= THRESHOLDS.BRUTE_FORCE_WINDOW_SEC) {
                        inWindow = true;
                        break;
                    }
                }
            }

            // Still flag if many failures even without tight window
            if (inWindow || failures.length >= THRESHOLDS.BRUTE_FORCE_COUNT * 2) {
                threats.push({
                    type: 'Brute Force Attack',
                    severity: failures.length >= 15 ? 'critical' : 'high',
                    description: `Possible brute force attack detected from IP ${ip} with ${failures.length} failed login attempts${inWindow ? ` within ${THRESHOLDS.BRUTE_FORCE_WINDOW_SEC} seconds` : ''}.`,
                    sourceIP: ip,
                    count: failures.length,
                    mitreId: 'T1110',
                    mitreName: 'Brute Force',
                    mitreTactic: 'Credential Access',
                    rawEvidence: failures.slice(0, 5).map(f => f.rawLine).join('\n'),
                });
            }
        }
    }

    return threats;
}

/**
 * Detect DDoS patterns: >100 requests from same IP within 60 seconds
 * Maps to MITRE ATT&CK T1498 (Network Denial of Service)
 */
function detectDDoS(entries) {
    const threats = [];
    const requestsByIP = {};

    for (const entry of entries) {
        if (!entry.sourceIP) continue;
        if (!requestsByIP[entry.sourceIP]) {
            requestsByIP[entry.sourceIP] = [];
        }
        requestsByIP[entry.sourceIP].push(entry);
    }

    for (const [ip, requests] of Object.entries(requestsByIP)) {
        if (requests.length >= THRESHOLDS.DDOS_REQUEST_COUNT) {
            const times = requests
                .map(r => new Date(r.timestamp).getTime())
                .filter(t => !isNaN(t))
                .sort();

            let maxInWindow = 0;
            if (times.length > 0) {
                for (let i = 0; i < times.length; i++) {
                    let count = 0;
                    for (let j = i; j < times.length; j++) {
                        if ((times[j] - times[i]) / 1000 <= THRESHOLDS.DDOS_WINDOW_SEC) {
                            count++;
                        } else break;
                    }
                    maxInWindow = Math.max(maxInWindow, count);
                }
            }

            if (maxInWindow >= THRESHOLDS.DDOS_REQUEST_COUNT || requests.length >= THRESHOLDS.DDOS_REQUEST_COUNT) {
                threats.push({
                    type: 'DDoS Pattern',
                    severity: 'critical',
                    description: `Potential DDoS attack from IP ${ip}: ${requests.length} total requests detected${maxInWindow > 0 ? `, peak ${maxInWindow} requests in ${THRESHOLDS.DDOS_WINDOW_SEC}s window` : ''}.`,
                    sourceIP: ip,
                    count: requests.length,
                    mitreId: 'T1498',
                    mitreName: 'Network Denial of Service',
                    mitreTactic: 'Impact',
                    rawEvidence: requests.slice(0, 3).map(r => r.rawLine).join('\n'),
                });
            }
        }
    }

    return threats;
}

/**
 * Detect exploit attempts: SQL injection, XSS, path traversal, etc.
 * Maps to MITRE ATT&CK T1190 (Exploit Public-Facing Application)
 */
function detectExploitAttempts(entries) {
    const threats = [];
    const exploitsByIP = {};

    for (const entry of entries) {
        if (isSuspiciousURL(entry)) {
            const ip = entry.sourceIP || 'unknown';
            if (!exploitsByIP[ip]) exploitsByIP[ip] = [];
            exploitsByIP[ip].push(entry);
        }
    }

    for (const [ip, exploits] of Object.entries(exploitsByIP)) {
        threats.push({
            type: 'Exploit Attempt',
            severity: exploits.length >= 5 ? 'critical' : 'high',
            description: `${exploits.length} suspicious request(s) detected from IP ${ip} containing potential exploit payloads (SQL injection, XSS, path traversal).`,
            sourceIP: ip,
            count: exploits.length,
            mitreId: 'T1190',
            mitreName: 'Exploit Public-Facing Application',
            mitreTactic: 'Initial Access',
            rawEvidence: exploits.slice(0, 3).map(e => e.rawLine).join('\n'),
        });
    }

    return threats;
}

/**
 * Detect port/service scanning: many unique paths accessed rapidly from same IP
 * Maps to MITRE ATT&CK T1046 (Network Service Discovery)
 */
function detectPortScanning(entries) {
    const threats = [];
    const pathsByIP = {};

    for (const entry of entries) {
        if (!entry.sourceIP || !entry.path) continue;
        if (!pathsByIP[entry.sourceIP]) pathsByIP[entry.sourceIP] = new Set();
        pathsByIP[entry.sourceIP].add(entry.path);
    }

    for (const [ip, paths] of Object.entries(pathsByIP)) {
        if (paths.size >= THRESHOLDS.SCAN_UNIQUE_PATHS) {
            threats.push({
                type: 'Reconnaissance / Port Scanning',
                severity: 'medium',
                description: `IP ${ip} accessed ${paths.size} unique paths — possible directory/service scanning activity.`,
                sourceIP: ip,
                count: paths.size,
                mitreId: 'T1046',
                mitreName: 'Network Service Discovery',
                mitreTactic: 'Discovery',
                rawEvidence: Array.from(paths).slice(0, 10).join(', '),
            });
        }
    }

    return threats;
}

/**
 * Detect clusters of suspicious HTTP status codes
 * Maps to MITRE ATT&CK T1078 (Valid Accounts — for auth failures)
 */
function detectSuspiciousStatusCodes(entries) {
    const threats = [];
    const statusCounts = {};
    const statusByIP = {};

    for (const entry of entries) {
        if (!entry.statusCode) continue;
        const code = entry.statusCode;

        if (code === 401 || code === 403 || code >= 500) {
            statusCounts[code] = (statusCounts[code] || 0) + 1;

            if (entry.sourceIP) {
                const key = `${entry.sourceIP}_${code}`;
                if (!statusByIP[key]) statusByIP[key] = { ip: entry.sourceIP, code, count: 0, entries: [] };
                statusByIP[key].count++;
                statusByIP[key].entries.push(entry);
            }
        }
    }

    for (const [, info] of Object.entries(statusByIP)) {
        if (info.count >= 10) {
            const isAuth = info.code === 401 || info.code === 403;
            threats.push({
                type: isAuth ? 'Unauthorized Access Attempts' : 'Server Error Spike',
                severity: info.count >= 50 ? 'critical' : info.count >= 20 ? 'high' : 'medium',
                description: `IP ${info.ip} triggered ${info.count} HTTP ${info.code} responses — ${isAuth ? 'possible credential stuffing or access abuse' : 'may indicate exploitation or misconfigured service'}.`,
                sourceIP: info.ip,
                count: info.count,
                mitreId: isAuth ? 'T1078' : 'T1190',
                mitreName: isAuth ? 'Valid Accounts' : 'Exploit Public-Facing Application',
                mitreTactic: isAuth ? 'Initial Access' : 'Initial Access',
                rawEvidence: info.entries.slice(0, 3).map(e => e.rawLine).join('\n'),
            });
        }
    }

    return threats;
}

/**
 * Detect anomalous patterns: off-hours, unusual user agents, rapid bursts
 * Maps to MITRE ATT&CK T1071 (Application Layer Protocol)
 */
function detectAnomalousPatterns(entries) {
    const threats = [];

    // Detect unusual user agents (scanners, bots)
    const suspiciousUAs = [
        /nikto/i, /sqlmap/i, /nmap/i, /masscan/i, /burp/i, /dirbuster/i,
        /gobuster/i, /wfuzz/i, /hydra/i, /metasploit/i, /zgrab/i,
        /python-requests/i, /curl\/\d/i, /wget/i,
    ];

    const uaByIP = {};
    for (const entry of entries) {
        if (!entry.userAgent) continue;
        for (const pattern of suspiciousUAs) {
            if (pattern.test(entry.userAgent)) {
                const ip = entry.sourceIP || 'unknown';
                if (!uaByIP[ip]) uaByIP[ip] = { ua: entry.userAgent, count: 0 };
                uaByIP[ip].count++;
                break;
            }
        }
    }

    for (const [ip, info] of Object.entries(uaByIP)) {
        if (info.count >= 3) {
            threats.push({
                type: 'Suspicious Tool Detected',
                severity: 'high',
                description: `IP ${ip} is using a known scanning/attack tool (${info.ua.substring(0, 60)}) — ${info.count} requests detected.`,
                sourceIP: ip,
                count: info.count,
                mitreId: 'T1595',
                mitreName: 'Active Scanning',
                mitreTactic: 'Reconnaissance',
                rawEvidence: `User-Agent: ${info.ua}`,
            });
        }
    }

    return threats;
}

/**
 * Detect unauthorized access patterns
 * Maps to MITRE ATT&CK T1133 (External Remote Services)
 */
function detectUnauthorizedAccess(entries) {
    const threats = [];
    const adminAccessByIP = {};

    const sensitivePatterns = [
        /\/admin/i, /\/dashboard/i, /\/api\/admin/i,
        /\/root/i, /\/config/i, /\/internal/i,
        /\/manager/i, /\/console/i,
    ];

    for (const entry of entries) {
        const path = entry.path || entry.message || '';
        if (sensitivePatterns.some(p => p.test(path)) && entry.sourceIP) {
            if (!adminAccessByIP[entry.sourceIP]) adminAccessByIP[entry.sourceIP] = [];
            adminAccessByIP[entry.sourceIP].push(entry);
        }
    }

    for (const [ip, accesses] of Object.entries(adminAccessByIP)) {
        const failedAccesses = accesses.filter(a =>
            a.statusCode === 401 || a.statusCode === 403 || a.statusCode === 404
        );

        if (failedAccesses.length >= 5) {
            threats.push({
                type: 'Unauthorized Admin Access',
                severity: 'high',
                description: `IP ${ip} attempted to access ${failedAccesses.length} restricted/admin endpoints — possible unauthorized access attempt.`,
                sourceIP: ip,
                count: failedAccesses.length,
                mitreId: 'T1133',
                mitreName: 'External Remote Services',
                mitreTactic: 'Initial Access',
                rawEvidence: failedAccesses.slice(0, 3).map(e => e.rawLine).join('\n'),
            });
        }
    }

    return threats;
}

module.exports = {
    runDetection,
    detectBruteForce,
    detectDDoS,
    detectExploitAttempts,
    detectPortScanning,
    detectSuspiciousStatusCodes,
    detectAnomalousPatterns,
    detectUnauthorizedAccess,
    THRESHOLDS,
};
