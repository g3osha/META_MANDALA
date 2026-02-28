const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'count.dat');
const PORT = 3333;

function readCount() {
  try { return parseInt(fs.readFileSync(DATA_FILE, 'utf8'), 10) || 0; }
  catch { return 0; }
}

function writeCount(n) {
  fs.writeFileSync(DATA_FILE, String(n));
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.url === '/api/count' && req.method === 'GET') {
    res.end(JSON.stringify({ count: readCount() }));
  } else if (req.url === '/api/count' && req.method === 'POST') {
    const count = readCount() + 1;
    writeCount(count);
    res.end(JSON.stringify({ count }));
  } else {
    res.writeHead(404);
    res.end('{}');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Counter API on :${PORT}`);
});
