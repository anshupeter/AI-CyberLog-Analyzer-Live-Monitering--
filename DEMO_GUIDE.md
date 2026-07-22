# CyberGuard Demo Guide

This guide explains where to go in the app, which files power the demo system, where the attack traffic is written, and how to run the simulation end to end.

## Where To Go

- Open the main dashboard at `/`.
- Open log upload mode at `/upload`.
- Open live monitoring and live detection at `/stream`.
- Open the demo website at `/demo`.
- Open AI analysis at `/analysis`.
- Open MITRE ATT&CK mapping at `/mitre`.

## What To Click

- Use the `Live Monitoring / Live Detection` tab for real-time watching of the demo log file.
- Use the `Open Demo Website` button inside the live monitoring screen to open the simple traffic generator page.
- Use the buttons on the demo website to create normal traffic or attack-like traffic.

## What File Does The Attack Simulation

- The main attack simulator script is [scripts/attack-simulator.js](scripts/attack-simulator.js).
- The shared traffic helper is [server/services/demoTraffic.js](server/services/demoTraffic.js).
- The live file watcher and detector bridge is [server/liveMonitor.js](server/liveMonitor.js).

## Where The Log File Goes

- The demo traffic is written to the shared live log file at `database/live-demo.log`.
- The file path is controlled by `LIVE_LOG_PATH` in [.env.example](.env.example).
- The file is ignored by Git in [.gitignore](.gitignore).

## How The Simulation Works

1. The demo website sends a request to `/api/demo/traffic`.
2. The backend builds simple Apache-style log lines in `server/services/demoTraffic.js`.
3. Those lines are appended to `database/live-demo.log`.
4. `server/liveMonitor.js` watches that file for new content.
5. New lines are parsed with the existing parser in [parser/logParser.js](parser/logParser.js).
6. The existing detection engine in [parser/detectionEngine.js](parser/detectionEngine.js) runs on the new entries without changing the detection rules.
7. New threats are stored in SQLite and broadcast over WebSocket to the UI.

## How The Result Is Shown

- New log lines appear in the live terminal view on `/stream`.
- New detections appear in the `Live Detections` panel on the right.
- The live session is stored in the database under the `live-monitoring` session.
- The dashboard and MITRE screens will also reflect the saved detections.

## How To Run The Demo

### Start The App

```bash
npm run dev
```

Then open:

- `http://localhost:5173/stream`
- `http://localhost:5000/demo`

### Run The Attack Simulator From The Terminal

```bash
npm run attack:demo
```

You can also choose a scenario:

```bash
npm run attack:demo bruteforce
npm run attack:demo scan
npm run attack:demo ddos
```

Optional second argument: interval in milliseconds.

```bash
npm run attack:demo mixed 1000
```

## What Changed

- Added a real live monitoring path that watches a shared log file and runs the existing detection engine on new entries.
- Added a simple demo website for generating safe traffic and attack-like traffic.
- Added a standalone attack simulator script for repeatable demo runs.
- Added UI controls and labels so the live monitoring section is clear and easy to find.
- Kept the core detection logic unchanged.

## Key Files

- [server/index.js](server/index.js)
- [server/liveMonitor.js](server/liveMonitor.js)
- [server/routes/demo.js](server/routes/demo.js)
- [server/services/demoTraffic.js](server/services/demoTraffic.js)
- [scripts/attack-simulator.js](scripts/attack-simulator.js)
- [client/src/pages/LogStream.jsx](client/src/pages/LogStream.jsx)
- [client/src/components/Sidebar.jsx](client/src/components/Sidebar.jsx)
