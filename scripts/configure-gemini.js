const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
  console.error('Run this command in an interactive VS Code terminal.');
  process.exit(1);
}

process.stdin.setEncoding('utf8');
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdout.write('Paste Gemini API key (input hidden), then press Enter. Ctrl+C cancels: ');

let apiKey = '';
let finished = false;

function finish(exitCode, message) {
  if (finished) return;
  finished = true;
  process.stdin.setRawMode(false);
  process.stdin.pause();
  process.stdout.write(`\n${message}\n`);
  process.exitCode = exitCode;
}

process.stdin.on('data', (chunk) => {
  for (const char of chunk) {
    if (char === '\u0003') {
      finish(1, 'Cancelled; no key was saved.');
      return;
    }

    if (char === '\r' || char === '\n') {
      const key = apiKey.trim();
      if (!key) {
        finish(1, 'No key entered; no changes were saved.');
        return;
      }

      const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      const line = `GEMINI_API_KEY=${key}`;
      const updated = /^\s*GEMINI_API_KEY=.*$/m.test(existing)
        ? existing.replace(/^\s*GEMINI_API_KEY=.*$/m, line)
        : `${existing.replace(/\s*$/, '')}\n${line}\n`;

      fs.writeFileSync(envPath, updated, { mode: 0o600 });
      finish(0, 'Gemini API key saved to local .env (value hidden). Restart the app to load it.');
      return;
    }

    if (char === '\u007f' || char === '\b') {
      apiKey = apiKey.slice(0, -1);
    } else if (char >= ' ') {
      apiKey += char;
    }
  }
});