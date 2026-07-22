const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Resend } = require('resend');
const { parseLogLine } = require('../parser/logParser');
const { runDetection } = require('../parser/detectionEngine');
const { ensureLogFile } = require('./services/demoTraffic');

const LIVE_SESSION_ID = 'live-monitoring';
const LIVE_SESSION_NAME = 'Live Monitoring';

function createLiveMonitor({ db, streamManager, filePath }) {
  const resolvedPath = ensureLogFile(filePath);
  let watcher = null;
  let lastSize = 0;
  let recentEntries = [];
  let lastEmailAlertAt = 0;
  const emittedThreatKeys = new Set();
  const resendApiKey = process.env.RESEND_API_KEY;
  const alertEmailTo = process.env.ALERT_EMAIL_TO;
  const alertEmailFrom = process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev';
  const resendClient = resendApiKey ? new Resend(resendApiKey) : null;
  const EMAIL_ALERT_COOLDOWN_MS = 60 * 1000;

  const insertEntry = db.prepare(`
    INSERT INTO log_entries (session_id, timestamp, source_ip, method, path, status_code, user_agent, message, raw_line, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertThreat = db.prepare(`
    INSERT INTO threats (session_id, type, severity, description, source_ip, count, mitre_id, mitre_name, mitre_tactic, raw_evidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const ensureSession = db.prepare(`
    INSERT OR IGNORE INTO analysis_sessions (id, filename, file_size, total_lines, threat_count, risk_score, ai_summary, status)
    VALUES (?, ?, 0, 0, 0, 0, 'Live monitoring stream', 'live')
  `);

  const updateSession = db.prepare(`
    UPDATE analysis_sessions
    SET file_size = ?, total_lines = COALESCE(total_lines, 0) + ?, threat_count = COALESCE(threat_count, 0) + ?, status = 'live'
    WHERE id = ?
  `);

  const insertEntries = db.transaction((entries) => {
    for (const entry of entries) {
      insertEntry.run(
        LIVE_SESSION_ID,
        entry.timestamp,
        entry.sourceIP,
        entry.method,
        entry.path,
        entry.statusCode,
        entry.userAgent,
        entry.message,
        entry.rawLine,
        entry.severity
      );
    }
  });

  const insertThreats = db.transaction((threats) => {
    for (const threat of threats) {
      insertThreat.run(
        LIVE_SESSION_ID,
        threat.type,
        threat.severity,
        threat.description,
        threat.sourceIP,
        threat.count,
        threat.mitreId,
        threat.mitreName,
        threat.mitreTactic,
        threat.rawEvidence
      );
    }
  });

  function broadcastStatus(status) {
    if (streamManager) {
      streamManager.broadcast({
        type: 'monitoring_status',
        status,
        filePath: resolvedPath,
        sessionId: LIVE_SESSION_ID,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async function sendLiveThreatEmail(threats) {
    if (!resendClient || !alertEmailTo) {
      console.log('Live threat detected, but email settings are missing. Set RESEND_API_KEY and ALERT_EMAIL_TO.');
      return;
    }

    const now = Date.now();
    if (now - lastEmailAlertAt < EMAIL_ALERT_COOLDOWN_MS) {
      console.log('Live threat detected, but email alert is cooling down.');
      return;
    }

    lastEmailAlertAt = now;

    const topThreats = threats.slice(0, 5).map((threat) => {
      const source = threat.sourceIP ? ` from ${threat.sourceIP}` : '';
      return `<li><strong>${threat.type}</strong> (${threat.severity})${source} - ${threat.description || 'Live attack detected'}</li>`;
    }).join('');

    await resendClient.emails.send({
      from: alertEmailFrom,
      to: alertEmailTo,
      subject: `CyberGuard live attack alert: ${threats.length} new detection${threats.length === 1 ? '' : 's'}`,
      html: `
        <p>A live attack was detected by CyberGuard.</p>
        <p><strong>New detections:</strong> ${threats.length}</p>
        <p><strong>Session:</strong> ${LIVE_SESSION_NAME}</p>
        <p><strong>Source log:</strong> ${resolvedPath}</p>
        <ul>${topThreats}</ul>
        <p>This alert is rate-limited to one email per minute while attacks continue.</p>
      `,
    });

    console.log(`Live threat email sent to ${alertEmailTo} for ${threats.length} detection(s).`);
  }

  function flushDelta() {
    if (!fs.existsSync(resolvedPath)) {
      ensureLogFile(resolvedPath);
    }

    const current = fs.readFileSync(resolvedPath);

    if (current.length < lastSize) {
      lastSize = 0;
      recentEntries = [];
      emittedThreatKeys.clear();
    }

    if (current.length === lastSize) {
      return;
    }

    const delta = current.slice(lastSize).toString('utf8');
    lastSize = current.length;

    const lines = delta.split(/\r?\n/).filter((line) => line.trim() !== '');
    const parsedEntries = [];

    for (const line of lines) {
      const parsed = parseLogLine(line);
      if (parsed) {
        parsedEntries.push(parsed);
      }
    }

    if (parsedEntries.length === 0) {
      return;
    }

    insertEntries(parsedEntries);
    recentEntries.push(...parsedEntries);

    if (recentEntries.length > 2000) {
      recentEntries = recentEntries.slice(-2000);
    }

    if (streamManager) {
      for (const entry of parsedEntries) {
        streamManager.broadcastLog(entry);
      }
    }

    const threats = runDetection(recentEntries);
    const newThreats = [];

    for (const threat of threats) {
      const key = `${threat.mitreId || 'na'}|${threat.sourceIP || 'unknown'}|${threat.type}`;
      if (emittedThreatKeys.has(key)) {
        continue;
      }

      emittedThreatKeys.add(key);
      newThreats.push(threat);
    }

    if (newThreats.length > 0) {
      insertThreats(newThreats);

      if (streamManager) {
        for (const threat of newThreats) {
          streamManager.broadcastThreat(threat);
        }
      }

      sendLiveThreatEmail(newThreats).catch((error) => {
        console.error('Failed to send live threat email:', error.message || error);
      });
    }

    updateSession.run(current.length, parsedEntries.length, newThreats.length, LIVE_SESSION_ID);
  }

  function start() {
    if (watcher) {
      return { filePath: resolvedPath, isActive: true };
    }

    ensureSession.run(LIVE_SESSION_ID, LIVE_SESSION_NAME);
    lastSize = fs.existsSync(resolvedPath) ? fs.statSync(resolvedPath).size : 0;

    const directory = path.dirname(resolvedPath);
    const filename = path.basename(resolvedPath);

    watcher = fs.watch(directory, { persistent: true }, (eventType, changedFile) => {
      if (!changedFile || changedFile !== filename) {
        return;
      }

      if (!fs.existsSync(resolvedPath)) {
        ensureLogFile(resolvedPath);
        lastSize = 0;
      }

      flushDelta();
    });

    broadcastStatus('started');
    return { filePath: resolvedPath, isActive: true };
  }

  function stop() {
    if (!watcher) {
      return { filePath: resolvedPath, isActive: false };
    }

    watcher.close();
    watcher = null;
    broadcastStatus('stopped');
    return { filePath: resolvedPath, isActive: false };
  }

  function status() {
    return {
      filePath: resolvedPath,
      isActive: Boolean(watcher),
      sessionId: LIVE_SESSION_ID,
    };
  }

  return {
    start,
    stop,
    status,
    filePath: resolvedPath,
    sessionId: LIVE_SESSION_ID,
  };
}

module.exports = createLiveMonitor;