const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'count.dat');
const KNOWLEDGE_FILE = path.join(__dirname, 'knowledge-base.json');
const PORT = 3333;

function readCount() {
  try { return parseInt(fs.readFileSync(DATA_FILE, 'utf8'), 10) || 0; }
  catch { return 0; }
}

function writeCount(n) {
  fs.writeFileSync(DATA_FILE, String(n));
}

function readKnowledgeBase() {
  try {
    return JSON.parse(fs.readFileSync(KNOWLEDGE_FILE, 'utf8'));
  } catch {
    return { version: 'unavailable', traditions: {}, symbols: {} };
  }
}

function respondJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function getKnowledgePath(pathname) {
  const kb = readKnowledgeBase();
  const parts = pathname.replace(/^\/api\/knowledge\/?/, '').split('/').filter(Boolean);
  if (!parts.length) return kb;
  return parts.reduce((node, part) => {
    if (!node || typeof node !== 'object') return undefined;
    return node[part];
  }, kb);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (url.pathname === '/api/count' && req.method === 'GET') {
    respondJson(res, 200, { count: readCount() });
  } else if (url.pathname === '/api/count' && req.method === 'POST') {
    const count = readCount() + 1;
    writeCount(count);
    respondJson(res, 200, { count });
  } else if (url.pathname === '/api/knowledge' && req.method === 'GET') {
    respondJson(res, 200, readKnowledgeBase());
  } else if (url.pathname.startsWith('/api/knowledge/') && req.method === 'GET') {
    const data = getKnowledgePath(url.pathname);
    if (data === undefined) {
      respondJson(res, 404, { error: 'knowledge path not found' });
      return;
    }
    respondJson(res, 200, data);
  } else {
    respondJson(res, 404, {});
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Counter API on :${PORT}`);
});
