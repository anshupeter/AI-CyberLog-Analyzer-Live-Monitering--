const express = require('express');
const { appendLogLines, createTrafficBatch } = require('../services/demoTraffic');

const router = express.Router();

module.exports = function (liveMonitor) {
  router.get('/status', (req, res) => {
    res.json({
      ok: true,
      liveMonitor: liveMonitor.status(),
    });
  });

  router.post('/traffic', (req, res) => {
    const scenario = (req.body?.scenario || 'mixed').toLowerCase();
    const count = Math.max(1, Math.min(500, parseInt(req.body?.count, 10) || 10));

    const lines = createTrafficBatch(scenario, count);
    appendLogLines(lines, liveMonitor.filePath);

    res.json({
      ok: true,
      scenario,
      count: lines.length,
      filePath: liveMonitor.filePath,
      lines,
    });
  });

  return router;
};