/**
 * SMART CONTROL — Local POS Print Agent (Xprinter XP-58 / XP-80 Direct Spooler Server)
 * Listens on http://127.0.0.1:12111
 * Sends raw ESC/POS bytes directly to Windows Print Spooler without browser dialogs.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- This standalone Node service uses CommonJS. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

const PORT = 12111;
const DEFAULT_PRINTER = 'AUTO';
const SCRIPT_PATH = path.join(__dirname, '..', 'print_raw.ps1');

const server = http.createServer((req, res) => {
  // Allow all CORS including Private Network Access from HTTPS websites
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', printer: DEFAULT_PRINTER, version: '1.0' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/print') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const printerName = data.printer || DEFAULT_PRINTER;
        let buffer;

        if (Array.isArray(data.bytes)) {
          buffer = Buffer.from(data.bytes);
        } else if (typeof data.base64 === 'string') {
          buffer = Buffer.from(data.base64, 'base64');
        } else if (typeof data.text === 'string') {
          buffer = Buffer.from(data.text, 'utf-8');
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: "Yaroqsiz ma'lumot (bytes yoki base64 talab qilinadi)" }));
          return;
        }

        const tempFilePath = path.join(os.tmpdir(), `sc_receipt_${Date.now()}.bin`);
        fs.writeFileSync(tempFilePath, buffer);

        execFile(
          'powershell.exe',
          [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', SCRIPT_PATH,
            '-printerName', printerName,
            '-filePath', tempFilePath
          ],
          (error, stdout, stderr) => {
            try {
              if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            } catch {}

            if (error) {
              console.error('Print spooler error:', stderr || error.message);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: stderr || error.message }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: "Chek printerdan chop etildi!" }));
            }
          }
        );
      } catch (err) {
        console.error('JSON parse error:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`SMART CONTROL Print Agent http://127.0.0.1:${PORT} da ishga tushdi.`);
});
