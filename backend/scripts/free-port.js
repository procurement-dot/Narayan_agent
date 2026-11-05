const { execSync } = require('child_process');

const port = Number(process.argv[2]) || 4000;
const currentPid = process.pid;

if (process.platform === 'win32') {
  try {
    const output = execSync('netstat -ano -p tcp', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const portRegex = new RegExp(`[:.]${port}\\s+`);
    const pidsToKill = new Set();

    for (const line of output.split('\n')) {
      if (portRegex.test(line)) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(Number(pid)) && Number(pid) !== currentPid && Number(pid) !== 0) {
          pidsToKill.add(pid);
        }
      }
    }

    for (const pid of pidsToKill) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`[Port Cleaner] Freed port ${port} (Killed lingering PID ${pid})`);
      } catch (err) {}
    }

    if (pidsToKill.size > 0) {
      const start = Date.now();
      while (Date.now() - start < 350) {}
    }
  } catch (e) {}
} else {
  try {
    execSync(`lsof -ti :${port} | grep -v ${currentPid} | xargs kill -9 2>/dev/null || true`, {
      stdio: 'ignore',
    });
  } catch (e) {}
}
