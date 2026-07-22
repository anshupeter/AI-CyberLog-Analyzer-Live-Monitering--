const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const db = require("./db");
const StreamManager = require("../websocket/streamManager");
const logRoutes = require("./routes/logs");
const createLiveMonitor = require("./liveMonitor");
const demoRoutes = require("./routes/demo");
const { getLogPath } = require("./services/demoTraffic");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "demo-site")));

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });
const streamManager = new StreamManager(wss);
const liveMonitor = createLiveMonitor({
  db,
  streamManager,
  filePath: getLogPath(),
});

app.use("/api/logs", logRoutes(db, streamManager));
app.use("/api/demo", demoRoutes(liveMonitor));

app.post("/api/live/start", (req, res) => {
  const status = liveMonitor.start();
  res.json({ success: true, ...status });
});

app.post("/api/live/stop", (req, res) => {
  const status = liveMonitor.stop();
  res.json({ success: true, ...status });
});

app.get("/api/live/status", (req, res) => {
  res.json({ success: true, ...liveMonitor.status() });
});

// Stream toggling routes
app.post("/api/stream/start", (req, res) => {
    streamManager.startSimulation();
    res.json({ success: true, status: "started" });
});

app.post("/api/stream/stop", (req, res) => {
    streamManager.stopSimulation();
    res.json({ success: true, status: "stopped" });
});

app.get("/api/stream/status", (req, res) => {
    res.json({ isSimulating: streamManager.isSimulating });
});

app.get("/", (req, res) => {
  res.send("🔥 AI Cyber Log Analyzer with Real-Time SIEM Running");
});

app.get("/demo", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "demo-site", "index.html"));
});

app.get("/demo-site/:file", (req, res) => {
    const file = path.basename(req.params.file);
    const allowed = new Set(["index.html", "app.js", "style.css"]);
    if (!allowed.has(file)) {
        return res.status(404).end();
    }

    res.sendFile(path.join(__dirname, "..", "demo-site", file));
});

if (!fs.existsSync(liveMonitor.filePath)) {
    fs.mkdirSync(path.dirname(liveMonitor.filePath), { recursive: true });
    fs.writeFileSync(liveMonitor.filePath, "", "utf8");
}

liveMonitor.start();

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🛰️ Demo site available at http://localhost:${PORT}/demo`);
});