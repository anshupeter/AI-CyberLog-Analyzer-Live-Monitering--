const path = require('path');
const {
  appendLogLines,
  createTrafficBatch,
  getLogPath,
} = require('../server/services/demoTraffic');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const scenario = (process.argv[2] || 'mixed').toLowerCase();
  const intervalMs = Math.max(250, parseInt(process.argv[3], 10) || 2000);
  const logPath = getLogPath();

  appendLogLines(createTrafficBatch('benign', 4), logPath);
  appendLogLines(createTrafficBatch(scenario, scenario === 'ddos' ? 120 : 12), logPath);

  console.log(`Attack simulator is writing to ${path.resolve(logPath)}`);
  console.log(`Scenario: ${scenario}`);
  console.log('Press Ctrl+C to stop.');

  const loop = scenario === 'ddos' ? 'ddos' : scenario === 'bruteforce' ? 'bruteforce' : scenario === 'scan' ? 'scan' : 'mixed';

  while (true) {
    await delay(intervalMs);
    const batch = createTrafficBatch(loop, loop === 'ddos' ? 120 : 10);
    appendLogLines(batch, logPath);
    console.log(`Appended ${batch.length} log lines`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});