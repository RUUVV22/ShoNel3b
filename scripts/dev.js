const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const serverEntry = path.join(projectRoot, 'server', 'src', 'index.js');
const expoCli = path.join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
const serverPort = Number(process.env.PORT || 3001);

function isGameServerRunning() {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: '127.0.0.1',
        port: serverPort,
        path: '/health',
        timeout: 1000,
      },
      (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          try {
            const health = JSON.parse(body);
            const found = response.statusCode === 200 && health.service === 'arabic-codenames-server';
            const available = new Set(health.games || []);
            resolve(found ? (['CODENAMES', 'WEREWOLF', 'KHASERNY', 'BOMB', 'MEN_WARAHA'].every(id => available.has(id)) ? 'current' : 'stale') : false);
          } catch {
            resolve(false);
          }
        });
      },
    );

    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve(false));
  });
}

function start(label, args) {
  const child = spawn(process.execPath, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    console.error(`[dev:${label}] Failed to start: ${error.message}`);
  });

  return child;
}

function terminate(child) {
  if (child.killed) {
    return;
  }

  if (process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }

  child.kill('SIGTERM');
}

async function main() {
  console.log('[dev] Starting the Sho Nel3b development environment...');

  let server = null;
  const serverState = await isGameServerRunning();
  if (serverState === 'stale') throw new Error('Old Sho Nel3b server detected on port 3001. Stop it before starting the updated game.');
  if (serverState === 'current') {
    console.log(`[dev] Reusing the game server already running on port ${serverPort}.`);
  } else {
    server = start('server', [serverEntry]);
  }

  const expoArgs = [expoCli, 'start'];
  if (process.argv.includes('--web')) {
    expoArgs.push('--web');
  }

  const expo = start('expo', expoArgs);
  const children = [server, expo].filter(Boolean);
  let stopping = false;

  function shutdown(exitCode = 0) {
    if (stopping) {
      return;
    }

    stopping = true;
    for (const child of children) {
      terminate(child);
    }

    setTimeout(() => process.exit(exitCode), 750);
  }

  for (const [label, child] of [
    ['server', server],
    ['expo', expo],
  ]) {
    if (!child) {
      continue;
    }

    child.on('error', () => shutdown(1));
    child.on('exit', (code, signal) => {
      if (stopping) {
        return;
      }

      if (code !== 0) {
        console.error(`[dev:${label}] Exited unexpectedly (${signal || code}).`);
      }
      shutdown(code || 0);
    });
  }

  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));
}

main().catch((error) => {
  console.error(`[dev] ${error.message}`);
  process.exit(1);
});
