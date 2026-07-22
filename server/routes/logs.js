/**
 * Log API Routes
 * Handles file upload, log retrieval, threat data, and analysis
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { parseLogs } = require('../../parser/logParser');
const { runDetection } = require('../../parser/detectionEngine');
const { analyzeSession } = require('../../parser/aiAnalyzer');

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
});

module.exports = function (db, streamManager) {
    /**
     * POST /api/logs/upload
     * Upload and analyze a log file
     */
    router.post('/upload', upload.single('logfile'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const sessionId = uuidv4();
            const content = fs.readFileSync(req.file.path, 'utf-8');
            const entries = parseLogs(content, req.file.originalname);

            if (entries.length === 0) {
                return res.status(400).json({ error: 'No valid log entries found in file' });
            }

            // Create analysis session
            db.prepare(`
        INSERT INTO analysis_sessions (id, filename, file_size, total_lines, status)
        VALUES (?, ?, ?, ?, 'processing')
      `).run(sessionId, req.file.originalname, req.file.size, entries.length);

            // Insert log entries in transaction
            const insertEntry = db.prepare(`
        INSERT INTO log_entries (session_id, timestamp, source_ip, method, path, status_code, user_agent, message, raw_line, severity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

            const insertTransaction = db.transaction((items) => {
                for (const entry of items) {
                    insertEntry.run(
                        sessionId,
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

            insertTransaction(entries);

            // Run detection engine
            const threats = runDetection(entries);

            // Insert threats
            const insertThreat = db.prepare(`
        INSERT INTO threats (session_id, type, severity, description, source_ip, count, mitre_id, mitre_name, mitre_tactic, raw_evidence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

            const threatTransaction = db.transaction((items) => {
                for (const threat of items) {
                    insertThreat.run(
                        sessionId,
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

            threatTransaction(threats);

            // Run AI analysis
            const analysis = analyzeSession(entries, threats);

            // Update session
            db.prepare(`
        UPDATE analysis_sessions SET threat_count = ?, risk_score = ?, ai_summary = ?, status = 'completed'
        WHERE id = ?
      `).run(threats.length, analysis.riskScore, analysis.summary, sessionId);

            // Broadcast to WebSocket clients
            if (streamManager) {
                streamManager.broadcast({
                    type: 'analysis_complete',
                    sessionId,
                    threatCount: threats.length,
                    riskScore: analysis.riskScore,
                });
            }

            // Clean up uploaded file
            fs.unlinkSync(req.file.path);

            res.json({
                sessionId,
                filename: req.file.originalname,
                totalEntries: entries.length,
                threatCount: threats.length,
                riskScore: analysis.riskScore,
                status: 'completed',
            });

        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: error.message || 'Upload failed' });
        }
    });

    /**
     * GET /api/logs
     * Retrieve paginated log entries
     */
    router.get('/', (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
            const offset = (page - 1) * limit;
            const sessionId = req.query.sessionId;
            const severity = req.query.severity;

            let query = 'SELECT * FROM log_entries WHERE 1=1';
            let countQuery = 'SELECT COUNT(*) as total FROM log_entries WHERE 1=1';
            const params = [];
            const countParams = [];

            if (sessionId) {
                query += ' AND session_id = ?';
                countQuery += ' AND session_id = ?';
                params.push(sessionId);
                countParams.push(sessionId);
            }

            if (severity) {
                query += ' AND severity = ?';
                countQuery += ' AND severity = ?';
                params.push(severity);
                countParams.push(severity);
            }

            const total = db.prepare(countQuery).get(...countParams).total;

            query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const entries = db.prepare(query).all(...params);

            res.json({
                entries,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('Logs fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch logs' });
        }
    });

    /**
     * GET /api/logs/stats
     * Aggregate statistics for the dashboard
     */
    router.get('/stats', (req, res) => {
        try {
            const totalLogs = db.prepare('SELECT COUNT(*) as count FROM log_entries').get().count;
            const totalThreats = db.prepare('SELECT COUNT(*) as count FROM threats').get().count;
            const criticalThreats = db.prepare("SELECT COUNT(*) as count FROM threats WHERE severity = 'critical'").get().count;
            const uniqueIPs = db.prepare('SELECT COUNT(DISTINCT source_ip) as count FROM log_entries WHERE source_ip IS NOT NULL').get().count;
            const totalSessions = db.prepare('SELECT COUNT(*) as count FROM analysis_sessions').get().count;

            const severityDistribution = db.prepare(`
        SELECT severity, COUNT(*) as count FROM threats GROUP BY severity
      `).all();

            const threatTypes = db.prepare(`
        SELECT type, COUNT(*) as count FROM threats GROUP BY type ORDER BY count DESC LIMIT 10
      `).all();

            const recentSessions = db.prepare(`
        SELECT * FROM analysis_sessions ORDER BY created_at DESC LIMIT 5
      `).all();

            const topIPs = db.prepare(`
        SELECT source_ip, COUNT(*) as count FROM log_entries
        WHERE source_ip IS NOT NULL
        GROUP BY source_ip ORDER BY count DESC LIMIT 10
      `).all();

            const statusCodeDist = db.prepare(`
        SELECT status_code, COUNT(*) as count FROM log_entries
        WHERE status_code IS NOT NULL
        GROUP BY status_code ORDER BY count DESC
      `).all();

            const recentThreats = db.prepare(`
        SELECT * FROM threats ORDER BY created_at DESC LIMIT 10
      `).all();

            const avgRiskScore = db.prepare(`
        SELECT AVG(risk_score) as avg FROM analysis_sessions WHERE status = 'completed'
      `).get().avg || 0;

            res.json({
                totalLogs,
                totalThreats,
                criticalThreats,
                uniqueIPs,
                totalSessions,
                avgRiskScore: Math.round(avgRiskScore),
                severityDistribution,
                threatTypes,
                recentSessions,
                topIPs,
                statusCodeDist,
                recentThreats,
            });
        } catch (error) {
            console.error('Stats fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch stats' });
        }
    });

    /**
     * GET /api/logs/threats
     * Retrieve all detected threats
     */
    router.get('/threats', (req, res) => {
        try {
            const sessionId = req.query.sessionId;
            let query = 'SELECT * FROM threats';
            const params = [];

            if (sessionId) {
                query += ' WHERE session_id = ?';
                params.push(sessionId);
            }

            query += ' ORDER BY created_at DESC';
            const threats = db.prepare(query).all(...params);
            res.json({ threats });
        } catch (error) {
            console.error('Threats fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch threats' });
        }
    });

    /**
     * GET /api/logs/analysis/:sessionId
     * Get full AI analysis for a session
     */
    router.get('/analysis/:sessionId', (req, res) => {
        try {
            const { sessionId } = req.params;

            const session = db.prepare('SELECT * FROM analysis_sessions WHERE id = ?').get(sessionId);
            if (!session) return res.status(404).json({ error: 'Session not found' });

            const entries = db.prepare('SELECT * FROM log_entries WHERE session_id = ?').all(sessionId);
            const threats = db.prepare('SELECT * FROM threats WHERE session_id = ?').all(sessionId);
            const rawLines = db.prepare('SELECT raw_line FROM log_entries WHERE session_id = ? ORDER BY id').all(sessionId).map(r => r.raw_line);

            const analysis = analyzeSession(entries, threats);

            res.json({
                session,
                analysis,
                threats,
                rawLogContent: rawLines.join('\n'),
                entryCount: entries.length,
            });
        } catch (error) {
            console.error('Analysis fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch analysis' });
        }
    });

    /**
     * GET /api/logs/sessions
     * List all analysis sessions
     */
    router.get('/sessions', (req, res) => {
        try {
            const sessions = db.prepare('SELECT * FROM analysis_sessions ORDER BY created_at DESC').all();
            res.json({ sessions });
        } catch (error) {
            console.error('Sessions fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    });

    /**
     * GET /api/logs/mitre
     * Get MITRE ATT&CK data
     */
    router.get('/mitre', (req, res) => {
        try {
            const techniques = db.prepare('SELECT * FROM mitre_techniques').all();
            const detectedTechniques = db.prepare(`
        SELECT DISTINCT mitre_id, mitre_name, mitre_tactic, severity, COUNT(*) as detection_count
        FROM threats
        WHERE mitre_id IS NOT NULL
        GROUP BY mitre_id
        ORDER BY detection_count DESC
      `).all();

            res.json({
                allTechniques: techniques,
                detectedTechniques,
            });
        } catch (error) {
            console.error('MITRE fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch MITRE data' });
        }
    });

    /**
     * DELETE /api/logs/session/:sessionId
     * Delete an analysis session and all associated data
     */
    router.delete('/session/:sessionId', (req, res) => {
        try {
            const { sessionId } = req.params;

            const session = db.prepare('SELECT * FROM analysis_sessions WHERE id = ?').get(sessionId);
            if (!session) return res.status(404).json({ error: 'Session not found' });

            const deleteAll = db.transaction(() => {
                db.prepare('DELETE FROM threats WHERE session_id = ?').run(sessionId);
                db.prepare('DELETE FROM log_entries WHERE session_id = ?').run(sessionId);
                db.prepare('DELETE FROM analysis_sessions WHERE id = ?').run(sessionId);
            });

            deleteAll();

            res.json({ success: true, deleted: session.filename });
        } catch (error) {
            console.error('Delete session error:', error);
            res.status(500).json({ error: 'Failed to delete session' });
        }
    });

    return router;
};
