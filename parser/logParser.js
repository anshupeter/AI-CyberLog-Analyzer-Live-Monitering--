/**
 * Log Parser Module
 * Supports: Apache/Nginx, JSON, CSV, Syslog, Generic text logs
 */

// Apache/Nginx Combined Log Format regex
const APACHE_REGEX = /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+\S+"\s+(\d{3})\s+(\d+|-)\s*"([^"]*)"\s*"([^"]*)"/;

// Syslog format regex
const SYSLOG_REGEX = /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\S+?)(?:\[(\d+)\])?:\s+(.+)/;

// Auth failure patterns
const AUTH_FAIL_PATTERNS = [
    /failed\s+password/i,
    /authentication\s+fail/i,
    /invalid\s+user/i,
    /login\s+failed/i,
    /access\s+denied/i,
    /unauthorized/i,
    /401/,
    /403/,
];

// Suspicious URL patterns
const SUSPICIOUS_URL_PATTERNS = [
    /(\.\.\/)|(\.\.\\)/,                    // Path traversal
    /(<script|<\/script|javascript:)/i,      // XSS
    /(union\s+select|or\s+1\s*=\s*1|drop\s+table)/i, // SQL injection
    /\/etc\/(passwd|shadow)/i,               // Linux file access
    /\/wp-admin|\/wp-login/i,               // WordPress attack
    /\/\.env|\/\.git/i,                      // Config file access
    /cmd\.exe|powershell|\/bin\/(bash|sh)/i, // Command injection
    /\/(phpmyadmin|adminer|phpinfo)/i,       // Admin panel scanning
];

function parseLogLine(line) {
    if (!line || line.trim() === '') return null;

    const trimmed = line.trim();

    // Try JSON format first
    try {
        const json = JSON.parse(trimmed);
        return normalizeJsonLog(json);
    } catch (e) {
        // Not JSON, continue
    }

    // Try Apache/Nginx format
    const apacheMatch = trimmed.match(APACHE_REGEX);
    if (apacheMatch) {
        return normalizeApacheLog(apacheMatch);
    }

    // Try Syslog format
    const syslogMatch = trimmed.match(SYSLOG_REGEX);
    if (syslogMatch) {
        return normalizeSyslog(syslogMatch);
    }

    // Generic text log
    return normalizeGenericLog(trimmed);
}

function normalizeApacheLog(match) {
    const [, ip, timestamp, method, reqPath, statusCode, , , userAgent] = match;
    const status = parseInt(statusCode, 10);

    return {
        timestamp: parseApacheDate(timestamp),
        sourceIP: ip,
        method: method,
        path: reqPath,
        statusCode: status,
        userAgent: userAgent || '',
        message: `${method} ${reqPath} ${status}`,
        rawLine: match[0],
        severity: getSeverityFromStatus(status),
    };
}

function normalizeSyslog(match) {
    const [fullMatch, timestamp, hostname, service, pid, message] = match;
    const ip = extractIP(message);
    const severity = getSeverityFromMessage(message);

    return {
        timestamp: parseSyslogDate(timestamp),
        sourceIP: ip,
        method: service,
        path: '',
        statusCode: null,
        userAgent: `${hostname}/${service}${pid ? `[${pid}]` : ''}`,
        message: message,
        rawLine: fullMatch,
        severity: severity,
    };
}

function normalizeJsonLog(json) {
    return {
        timestamp: json.timestamp || json.time || json.date || json['@timestamp'] || new Date().toISOString(),
        sourceIP: json.ip || json.source_ip || json.remote_addr || json.clientIP || json.client_ip || extractIP(JSON.stringify(json)),
        method: json.method || json.request_method || json.verb || '',
        path: json.path || json.url || json.request || json.uri || '',
        statusCode: json.status || json.statusCode || json.status_code || json.response_code || null,
        userAgent: json.user_agent || json.userAgent || json.agent || '',
        message: json.message || json.msg || json.log || JSON.stringify(json),
        rawLine: JSON.stringify(json),
        severity: json.level || json.severity || json.log_level || getSeverityFromMessage(json.message || ''),
    };
}

function normalizeGenericLog(line) {
    const ip = extractIP(line);
    const timestamp = extractTimestamp(line);
    const severity = getSeverityFromMessage(line);

    return {
        timestamp: timestamp || new Date().toISOString(),
        sourceIP: ip,
        method: '',
        path: '',
        statusCode: null,
        userAgent: '',
        message: line,
        rawLine: line,
        severity: severity,
    };
}

function parseCSVLogs(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const entries = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;

        const obj = {};
        headers.forEach((h, idx) => {
            obj[h] = values[idx];
        });

        entries.push(normalizeJsonLog(obj));
    }

    return entries;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function parseLogs(content, filename) {
    const ext = filename ? filename.split('.').pop().toLowerCase() : '';

    if (ext === 'csv') {
        return parseCSVLogs(content);
    }

    const lines = content.split('\n').filter(l => l.trim() !== '');
    const entries = [];

    for (const line of lines) {
        const entry = parseLogLine(line);
        if (entry) {
            entries.push(entry);
        }
    }

    return entries;
}

// --- Utility Functions ---

function extractIP(text) {
    if (!text) return null;
    const ipMatch = text.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
    return ipMatch ? ipMatch[1] : null;
}

function extractTimestamp(text) {
    // ISO 8601
    const isoMatch = text.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/);
    if (isoMatch) return new Date(isoMatch[0]).toISOString();

    // Common log date
    const clfMatch = text.match(/\[(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2})/);
    if (clfMatch) return parseApacheDate(clfMatch[1]);

    return null;
}

function parseApacheDate(dateStr) {
    try {
        const cleaned = dateStr.replace(/\//g, ' ').replace(':', ' ');
        return new Date(cleaned).toISOString();
    } catch {
        return new Date().toISOString();
    }
}

function parseSyslogDate(dateStr) {
    try {
        const year = new Date().getFullYear();
        return new Date(`${dateStr} ${year}`).toISOString();
    } catch {
        return new Date().toISOString();
    }
}

function getSeverityFromStatus(status) {
    if (status >= 500) return 'error';
    if (status === 401 || status === 403) return 'warning';
    if (status >= 400) return 'warning';
    if (status >= 300) return 'info';
    return 'info';
}

function getSeverityFromMessage(message) {
    if (!message) return 'info';
    const lower = message.toLowerCase();
    if (lower.includes('critical') || lower.includes('emergency') || lower.includes('fatal')) return 'critical';
    if (lower.includes('error') || lower.includes('fail') || lower.includes('denied')) return 'error';
    if (lower.includes('warn') || lower.includes('unauthorized') || lower.includes('invalid')) return 'warning';
    return 'info';
}

function isAuthFailure(entry) {
    const text = (entry.message + ' ' + (entry.rawLine || '')).toLowerCase();
    if (entry.statusCode === 401 || entry.statusCode === 403) return true;
    return AUTH_FAIL_PATTERNS.some(p => p.test(text));
}

function isSuspiciousURL(entry) {
    const url = entry.path || entry.message || '';
    return SUSPICIOUS_URL_PATTERNS.some(p => p.test(url));
}

module.exports = {
    parseLogLine,
    parseLogs,
    parseCSVLogs,
    extractIP,
    isAuthFailure,
    isSuspiciousURL,
    AUTH_FAIL_PATTERNS,
    SUSPICIOUS_URL_PATTERNS,
};
