const fs = require('fs');
const path = require('path');

const DEFAULT_LOG_PATH = path.join(__dirname, '..', '..', 'database', 'live-demo.log');

const BENIGN_PATHS = ['/', '/home', '/products', '/dashboard', '/api/health', '/status', '/about'];
const SCAN_PATHS = [
  '/admin', '/login', '/wp-login.php', '/phpmyadmin', '/.env', '/.git/HEAD',
  '/robots.txt', '/config', '/api/admin/users', '/manager/html', '/console',
  '/../../../../etc/passwd', "/?q=' OR '1'='1", '/search?q=<script>alert(1)</script>',
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  'curl/8.0.1',
  'python-requests/2.31.0',
  'Nmap Scripting Engine',
  'sqlmap/1.7.2',
  'Nikto/2.1.7',
];

function getLogPath() {
  return process.env.LIVE_LOG_PATH ? path.resolve(process.env.LIVE_LOG_PATH) : DEFAULT_LOG_PATH;
}

function ensureLogFile(filePath = getLogPath()) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf8');
  }

  return filePath;
}

function appendLogLines(lines, filePath = getLogPath()) {
  const target = ensureLogFile(filePath);
  const normalized = Array.isArray(lines) ? lines : [lines];
  fs.appendFileSync(target, `${normalized.filter(Boolean).join('\n')}\n`, 'utf8');
  return target;
}

function createApacheLine({ ip, method, requestPath, statusCode, userAgent, referrer = '-', size = 512 }) {
  const stamp = new Date().toUTCString();
  return `${ip} - - [${stamp}] "${method} ${requestPath} HTTP/1.1" ${statusCode} ${size} "${referrer}" "${userAgent}"`;
}

function randomPick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomIp(prefix = '203.0.113') {
  return `${prefix}.${Math.floor(Math.random() * 200) + 20}`;
}

function createBenignTrafficBatch(count = 5) {
  const ip = randomIp('192.168.10');
  const lines = [];

  for (let index = 0; index < count; index += 1) {
    const requestPath = randomPick(BENIGN_PATHS);
    const method = requestPath === '/api/health' || requestPath === '/status' ? 'GET' : randomPick(['GET', 'POST']);
    const statusCode = requestPath === '/api/health' ? 200 : randomPick([200, 200, 200, 304]);

    lines.push(createApacheLine({
      ip,
      method,
      requestPath,
      statusCode,
      userAgent: randomPick(USER_AGENTS),
    }));
  }

  return lines;
}

function createBruteForceBatch(count = 8) {
  const ip = randomIp('198.51.100');
  const lines = [];

  for (let index = 0; index < count; index += 1) {
    lines.push(createApacheLine({
      ip,
      method: 'POST',
      requestPath: '/login',
      statusCode: 401,
      userAgent: randomPick(USER_AGENTS),
    }));
  }

  return lines;
}

function createScanningBatch(count = 24) {
  const ip = randomIp('203.0.113');
  const lines = [];

  for (let index = 0; index < count; index += 1) {
    const requestPath = `${randomPick(SCAN_PATHS)}${index % 2 === 0 ? `?id=${index}` : ''}`;
    lines.push(createApacheLine({
      ip,
      method: 'GET',
      requestPath,
      statusCode: randomPick([200, 301, 403, 404]),
      userAgent: randomPick(USER_AGENTS),
    }));
  }

  return lines;
}

function createDdosBatch(count = 120) {
  const ip = randomIp('45.33.32');
  const lines = [];

  for (let index = 0; index < count; index += 1) {
    lines.push(createApacheLine({
      ip,
      method: 'GET',
      requestPath: '/api/health',
      statusCode: 200,
      userAgent: randomPick(USER_AGENTS),
    }));
  }

  return lines;
}

function createMixedDemoBatch() {
  return [
    ...createBenignTrafficBatch(4),
    ...createBruteForceBatch(6),
    ...createScanningBatch(12),
  ];
}

function createTrafficBatch(scenario = 'mixed', count = 10) {
  switch (scenario) {
    case 'benign':
      return createBenignTrafficBatch(count);
    case 'bruteforce':
    case 'brute-force':
      return createBruteForceBatch(count);
    case 'scan':
    case 'recon':
      return createScanningBatch(count);
    case 'ddos':
      return createDdosBatch(count);
    case 'mixed':
    default:
      return createMixedDemoBatch();
  }
}

module.exports = {
  getLogPath,
  ensureLogFile,
  appendLogLines,
  createTrafficBatch,
  createBenignTrafficBatch,
  createBruteForceBatch,
  createScanningBatch,
  createDdosBatch,
};