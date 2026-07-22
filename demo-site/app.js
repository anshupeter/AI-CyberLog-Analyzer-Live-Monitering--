async function postTraffic(scenario, count) {
  const response = await fetch('/api/demo/traffic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, count }),
  });

  if (!response.ok) {
    throw new Error('Failed to write demo traffic');
  }

  return response.json();
}

async function refreshStatus() {
  const response = await fetch('/api/demo/status');
  const data = await response.json();
  const state = document.getElementById('monitorState');
  const path = document.getElementById('monitorPath');

  if (data?.liveMonitor) {
    state.textContent = data.liveMonitor.isActive ? 'Live monitoring active' : 'Live monitoring idle';
    path.textContent = data.liveMonitor.filePath;
  } else {
    state.textContent = 'Live monitor unavailable';
    path.textContent = 'Could not load monitoring status';
  }
}

function setOutput(text) {
  document.getElementById('output').textContent = text;
}

document.querySelectorAll('[data-scenario]').forEach((button) => {
  button.addEventListener('click', async () => {
    const scenario = button.dataset.scenario;
    button.disabled = true;

    try {
      setOutput(`Writing ${scenario} traffic...`);
      const result = await postTraffic(scenario, scenario === 'ddos' ? 120 : 12);
      setOutput(`Wrote ${result.count} log lines for scenario: ${result.scenario}`);
    } catch (error) {
      setOutput(error.message);
    } finally {
      button.disabled = false;
    }
  });
});

refreshStatus().catch(() => setOutput('Could not read live monitor status.'));