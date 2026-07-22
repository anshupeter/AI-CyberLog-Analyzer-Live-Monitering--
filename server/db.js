const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'database');
const DB_PATH = path.join(DB_DIR, 'logs.db');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS analysis_sessions (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    total_lines INTEGER DEFAULT 0,
    threat_count INTEGER DEFAULT 0,
    risk_score REAL DEFAULT 0,
    ai_summary TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS log_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    timestamp TEXT,
    source_ip TEXT,
    method TEXT,
    path TEXT,
    status_code INTEGER,
    user_agent TEXT,
    message TEXT,
    raw_line TEXT,
    severity TEXT DEFAULT 'info',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS threats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT,
    source_ip TEXT,
    count INTEGER DEFAULT 1,
    mitre_id TEXT,
    mitre_name TEXT,
    mitre_tactic TEXT,
    raw_evidence TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS mitre_techniques (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tactic TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'medium',
    url TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_log_entries_session ON log_entries(session_id);
  CREATE INDEX IF NOT EXISTS idx_log_entries_source_ip ON log_entries(source_ip);
  CREATE INDEX IF NOT EXISTS idx_log_entries_severity ON log_entries(severity);
  CREATE INDEX IF NOT EXISTS idx_threats_session ON threats(session_id);
  CREATE INDEX IF NOT EXISTS idx_threats_severity ON threats(severity);
  CREATE INDEX IF NOT EXISTS idx_threats_mitre_id ON threats(mitre_id);
`);

// Seed MITRE ATT&CK techniques
const seedMitre = db.prepare(`
  INSERT OR IGNORE INTO mitre_techniques (id, name, tactic, description, severity, url) VALUES (?, ?, ?, ?, ?, ?)
`);

const mitreData = [
  ['T1110', 'Brute Force', 'Credential Access', 'Adversaries may use brute force techniques to gain access to accounts when passwords are unknown or when password hashes are obtained.', 'critical', 'https://attack.mitre.org/techniques/T1110/'],
  ['T1110.001', 'Password Guessing', 'Credential Access', 'Adversaries with no prior knowledge of legitimate credentials may guess passwords to attempt access to accounts.', 'high', 'https://attack.mitre.org/techniques/T1110/001/'],
  ['T1110.003', 'Password Spraying', 'Credential Access', 'Adversaries may use a single or small list of commonly used passwords against many different accounts.', 'high', 'https://attack.mitre.org/techniques/T1110/003/'],
  ['T1078', 'Valid Accounts', 'Initial Access', 'Adversaries may obtain and abuse credentials of existing accounts to gain Initial Access, Persistence, Privilege Escalation, or Defense Evasion.', 'high', 'https://attack.mitre.org/techniques/T1078/'],
  ['T1190', 'Exploit Public-Facing Application', 'Initial Access', 'Adversaries may attempt to take advantage of a weakness in an Internet-facing computer or program using software, data, or commands.', 'critical', 'https://attack.mitre.org/techniques/T1190/'],
  ['T1003', 'OS Credential Dumping', 'Credential Access', 'Adversaries may attempt to dump credentials to obtain account login and credential material.', 'critical', 'https://attack.mitre.org/techniques/T1003/'],
  ['T1498', 'Network Denial of Service', 'Impact', 'Adversaries may perform Network Denial of Service (DoS) attacks to degrade or block the availability of targeted resources.', 'critical', 'https://attack.mitre.org/techniques/T1498/'],
  ['T1071', 'Application Layer Protocol', 'Command and Control', 'Adversaries may communicate using application layer protocols to avoid detection/network filtering.', 'medium', 'https://attack.mitre.org/techniques/T1071/'],
  ['T1046', 'Network Service Discovery', 'Discovery', 'Adversaries may attempt to get a listing of services running on remote hosts and local network infrastructure devices.', 'medium', 'https://attack.mitre.org/techniques/T1046/'],
  ['T1595', 'Active Scanning', 'Reconnaissance', 'Adversaries may execute active reconnaissance scans to gather information that can be used during targeting.', 'medium', 'https://attack.mitre.org/techniques/T1595/'],
  ['T1059', 'Command and Scripting Interpreter', 'Execution', 'Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.', 'high', 'https://attack.mitre.org/techniques/T1059/'],
  ['T1548', 'Abuse Elevation Control Mechanism', 'Privilege Escalation', 'Adversaries may circumvent mechanisms designed to control elevate privileges to gain higher-level permissions.', 'critical', 'https://attack.mitre.org/techniques/T1548/'],
  ['T1040', 'Network Sniffing', 'Credential Access', 'Adversaries may sniff network traffic to capture information about an environment, including authentication material.', 'high', 'https://attack.mitre.org/techniques/T1040/'],
  ['T1562', 'Impair Defenses', 'Defense Evasion', 'Adversaries may maliciously modify components of a victim environment to hinder or disable defensive mechanisms.', 'critical', 'https://attack.mitre.org/techniques/T1562/'],
  ['T1133', 'External Remote Services', 'Initial Access', 'Adversaries may leverage external-facing remote services to initially access and/or persist within a network.', 'high', 'https://attack.mitre.org/techniques/T1133/'],
];

const seedTransaction = db.transaction(() => {
  for (const row of mitreData) {
    seedMitre.run(...row);
  }
});

seedTransaction();

console.log('✅ Database initialized at:', DB_PATH);

module.exports = db;
