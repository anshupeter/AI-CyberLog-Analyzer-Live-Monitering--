const chokidar = require("chokidar");
const fs = require("fs");
const { parseLogLine } = require("../parser/logParser");

function startWatcher(streamManager, filePath) {
  let lastSize = 0;

  if (!fs.existsSync(filePath)) {
    console.log("Log file not found:", filePath);
    try {
        fs.writeFileSync(filePath, "");
    } catch(e) {}
  }

  if (fs.existsSync(filePath)) {
    const initialStats = fs.statSync(filePath);
    lastSize = initialStats.size;
  }

  chokidar.watch(filePath).on("change", () => {
    const stats = fs.statSync(filePath);

    if (stats.size > lastSize) {
      const stream = fs.createReadStream(filePath, {
        start: lastSize,
        end: stats.size
      });

      let data = "";

      stream.on("data", chunk => data += chunk.toString());

      stream.on("end", () => {
        const lines = data.split("\n").filter(l => l.trim() !== "");

        lines.forEach(line => {
          const parsed = parseLogLine(line);
          if (parsed) {
              streamManager.broadcastLog(parsed);
          }
        });
      });

      lastSize = stats.size;
    } else if (stats.size < lastSize) {
        lastSize = stats.size;
    }
  });

  console.log("🔥 Real-time monitoring enabled on", filePath);
}

module.exports = startWatcher;