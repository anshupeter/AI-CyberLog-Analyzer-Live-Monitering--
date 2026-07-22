/**
 * WebSocket Stream Manager
 * Real-time log streaming with simulated log generation for demo
 */

const { v4: uuidv4 } = require('uuid');

class StreamManager {
    constructor(wss) {
        this.wss = wss;
        this.clients = new Set();
        this.simulationInterval = null;
        this.isSimulating = false;

        wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log(`📡 WebSocket client connected (${this.clients.size} total)`);

            ws.send(JSON.stringify({
                type: 'connection',
                message: 'Connected to Cyber Log Analyzer stream',
                timestamp: new Date().toISOString(),
            }));

            ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data);
                    if (msg.action === 'start_simulation') this.startSimulation();
                    if (msg.action === 'stop_simulation') this.stopSimulation();
                } catch (e) { /* ignore malformed messages */ }
            });

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(`📡 WebSocket client disconnected (${this.clients.size} total)`);
            });
        });
    }

    /**
     * Broadcast a message to all connected clients
     */
    broadcast(data) {
        const message = JSON.stringify(data);
        for (const client of this.clients) {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(message);
            }
        }
    }

    /**
     * Broadcast a new log entry
     */
    broadcastLog(entry) {
        this.broadcast({
            type: 'log',
            data: entry,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast a detected threat
     */
    broadcastThreat(threat) {
        this.broadcast({
            type: 'threat',
            data: threat,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Start simulated log generation for SIEM demo
     */
    startSimulation() {
        if (this.isSimulating) return;
        this.isSimulating = true;

        console.log('🔄 Starting log simulation...');
        this.broadcast({ type: 'simulation', status: 'started' });

        const interval = parseInt(process.env.SIMULATED_LOG_INTERVAL) || 800;

        this.simulationInterval = setInterval(() => {
            const entry = generateSimulatedLog();
            this.broadcastLog(entry);

            // Occasionally generate a threat (20% chance)
            if (Math.random() < 0.20) {
                const threat = generateSimulatedThreat(entry);
                this.broadcastThreat(threat);
            }
        }, interval);
    }

    /**
     * Stop simulated log generation
     */
    stopSimulation() {
        if (!this.isSimulating) return;
        this.isSimulating = false;

        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }

        console.log('⏹️ Stopped log simulation');
        this.broadcast({ type: 'simulation', status: 'stopped' });
    }
}

// --- Simulated Log Data ---

const SAMPLE_IPS = [
    '192.168.1.105', '10.0.0.55', '172.16.0.22', '203.0.113.50',
    '198.51.100.14', '192.168.0.5', '10.10.10.10', '45.33.32.156',
    '103.235.46.85', '185.220.101.34', '91.121.87.18', '77.247.181.163',
    '162.247.74.7', '104.244.73.95', '23.129.64.210',
];

const SAMPLE_PATHS = [
    '/api/login', '/api/users', '/dashboard', '/api/data', '/admin',
    '/api/auth/token', '/home', '/api/logs', '/config', '/api/settings',
    '/wp-login.php', '/phpmyadmin', '/.env', '/api/admin/users',
    '/robots.txt', '/sitemap.xml', '/api/health', '/api/v2/export',
    "/' OR '1'='1", '/../../../../etc/passwd', '/api/upload',
    '/console', '/manager/html', '/.git/HEAD',
];

const SAMPLE_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'];
const SAMPLE_STATUS = [200, 200, 200, 200, 301, 304, 400, 401, 401, 403, 403, 404, 500, 502];
const SAMPLE_UAS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    'curl/7.68.0',
    'python-requests/2.28.1',
    'Nmap Scripting Engine',
    'sqlmap/1.6.12',
    'Mozilla/5.0 (compatible; Googlebot/2.1)',
    'Nikto/2.1.6',
];

const SAMPLE_MESSAGES = [
    'User authentication successful',
    'Failed password for admin from {ip}',
    'Invalid user root from {ip}',
    'Connection closed by authenticating user',
    'Accepted publickey for deploy from {ip}',
    'session opened for user www-data',
    'Access denied for user admin',
    'GET /api/health HTTP/1.1 200',
    'Rate limit exceeded for {ip}',
    'Suspicious SQL pattern detected in request',
    'Firewall blocked connection from {ip}',
    'Certificate verification failed',
    'Unauthorized access attempt to /admin',
    'Brute force lockout triggered for {ip}',
    'New SSH connection from {ip}',
];

function generateSimulatedLog() {
    const ip = randomPick(SAMPLE_IPS);
    const path = randomPick(SAMPLE_PATHS);
    const method = randomPick(SAMPLE_METHODS);
    const status = randomPick(SAMPLE_STATUS);
    const ua = randomPick(SAMPLE_UAS);
    const message = randomPick(SAMPLE_MESSAGES).replace(/{ip}/g, ip);

    const severity = status >= 500 ? 'error'
        : (status === 401 || status === 403) ? 'warning'
            : status >= 400 ? 'warning'
                : 'info';

    return {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        sourceIP: ip,
        method,
        path,
        statusCode: status,
        userAgent: ua,
        message,
        rawLine: `${ip} - - [${new Date().toUTCString()}] "${method} ${path} HTTP/1.1" ${status} - "${ua}"`,
        severity,
    };
}

const THREAT_TYPES = [
    { type: 'Brute Force Attack', severity: 'critical', mitreId: 'T1110', mitreName: 'Brute Force', mitreTactic: 'Credential Access' },
    { type: 'DDoS Pattern', severity: 'critical', mitreId: 'T1498', mitreName: 'Network Denial of Service', mitreTactic: 'Impact' },
    { type: 'Exploit Attempt', severity: 'high', mitreId: 'T1190', mitreName: 'Exploit Public-Facing Application', mitreTactic: 'Initial Access' },
    { type: 'Reconnaissance / Port Scanning', severity: 'medium', mitreId: 'T1046', mitreName: 'Network Service Discovery', mitreTactic: 'Discovery' },
    { type: 'Suspicious Tool Detected', severity: 'high', mitreId: 'T1595', mitreName: 'Active Scanning', mitreTactic: 'Reconnaissance' },
    { type: 'Unauthorized Admin Access', severity: 'high', mitreId: 'T1133', mitreName: 'External Remote Services', mitreTactic: 'Initial Access' },
];

function generateSimulatedThreat(entry) {
    const template = randomPick(THREAT_TYPES);
    return {
        ...template,
        id: uuidv4(),
        description: `${template.type} detected from IP ${entry.sourceIP} — automated alert from simulated stream.`,
        sourceIP: entry.sourceIP,
        count: Math.floor(Math.random() * 50) + 5,
        rawEvidence: entry.rawLine,
        created_at: new Date().toISOString(),
    };
}

function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = StreamManager;
