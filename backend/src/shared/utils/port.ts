import { execSync } from 'child_process';

/**
 * Free a port by terminating any existing process currently listening on it.
 * Cross-platform (Windows / macOS / Linux).
 */
export function freePort(port: number): void {
  const currentPid = process.pid;
  if (process.platform === 'win32') {
    try {
      const output = execSync('netstat -ano -p tcp', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const portRegex = new RegExp(`[:.]${port}\\s+`);
      const pidsToKill = new Set<string>();

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
          console.log(`[Port Cleaner] Freed port ${port} by terminating lingering process (PID ${pid})`);
        } catch {}
      }

      if (pidsToKill.size > 0) {
        // Short synchronous delay to let Windows OS fully release socket
        const start = Date.now();
        while (Date.now() - start < 350) {}
      }
    } catch (e) {
      // Ignore errors if netstat is not available
    }
  } else {
    try {
      execSync(`lsof -ti :${port} | grep -v ${currentPid} | xargs kill -9 2>/dev/null || true`, {
        stdio: 'ignore',
      });
    } catch {}
  }
}
