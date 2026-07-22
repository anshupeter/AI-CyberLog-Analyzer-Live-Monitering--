-- Cyber Log Analyzer Database Schema
-- Auto-created by server/db.js on first run

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_log_entries_session ON log_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_source_ip ON log_entries(source_ip);
CREATE INDEX IF NOT EXISTS idx_log_entries_severity ON log_entries(severity);
CREATE INDEX IF NOT EXISTS idx_threats_session ON threats(session_id);
CREATE INDEX IF NOT EXISTS idx_threats_severity ON threats(severity);
CREATE INDEX IF NOT EXISTS idx_threats_mitre_id ON threats(mitre_id);
