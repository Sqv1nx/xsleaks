'use strict';

const express = require('express');
const session = require('express-session');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuid } = require('uuid');
const fetch   = require('node-fetch');

const PORT           = process.env.PORT || 9000;
const ADMIN_USER     = 'admin';
const ADMIN_PASSWORD = process.env.SECRET || 'xxxxxxxxxxxxxxxxxxxxxxx';
const FLAG           = process.env.FLAG   || ('FLAG{' + ADMIN_PASSWORD + '}');

if (ADMIN_PASSWORD.length !== 23) {
  console.warn('[!] SECRET length = ' + ADMIN_PASSWORD.length + ', expected 23');
} else {
  console.log('[showcase] SECRET length OK (23)');
}
if (FLAG !== 'FLAG{' + ADMIN_PASSWORD + '}') {
  console.warn('[!] FLAG does not match FLAG{SECRET} shape');
}

const USERHOST_URL = process.env.USERHOST_URL || 'http://localhost:9001';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

const SHARED_DIR  = path.join(__dirname, 'shared');
const UPLOADS_DIR = path.join(SHARED_DIR, 'uploads');
const REPORTS_DIR = path.join(SHARED_DIR, 'reports');
const PUBLIC_DIR  = path.join(__dirname, 'public');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(REPORTS_DIR, { recursive: true });

const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Allow the player's uploaded HTML (served from userhost) to POST reports back.
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(session({
  name: 'showcase.sid',
  secret: 'rigged-showcase-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    domain: COOKIE_DOMAIN,
    maxAge: 3600 * 1000
  }
}));

app.use(express.static(PUBLIC_DIR, { index: false }));

const upload = multer({
  limits: { fileSize: 1024 * 1024 },
  storage: multer.memoryStorage()
});

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/login', (req, res) => {
  res.send('<!doctype html><html><body style="font-family:sans-serif;background:#0a0b14;color:#eef">'
    + '<form method="POST" action="/login" style="max-width:320px;margin:80px auto">'
    + '<h2>Judge Login</h2>'
    + '<p><input name="username" style="width:100%;padding:8px"></p>'
    + '<p><input name="password" type="password" style="width:100%;padding:8px"></p>'
    + '<p><button type="submit" style="padding:8px 16px">Sign in</button></p>'
    + '</form></body></html>');
});

app.post('/login', (req, res) => {
  const body = req.body || {};
  if (body.username === ADMIN_USER && body.password === ADMIN_PASSWORD) {
    req.session.user = ADMIN_USER;
    return res.redirect('/admin');
  }
  res.status(401).send('Invalid credentials');
});

app.get('/admin', (req, res) => {
  if (req.session.user !== ADMIN_USER) return res.status(403).send('Forbidden');
  res.send('Admin panel. Use /result/:id?password=...');
});

app.post('/upload', upload.single('html'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const id = uuid();
  fs.mkdirSync(path.join(UPLOADS_DIR, id), { recursive: true });
  fs.writeFileSync(path.join(UPLOADS_DIR, id, 'index.html'), req.file.buffer);
  fs.writeFileSync(path.join(REPORTS_DIR, id + '.json'), JSON.stringify({ output: [] }));

  await new Promise(r => setTimeout(r, 800));
  const trigger = process.env.BOT_TRIGGER_URL || 'http://bot:9999/run';
  fetch(trigger, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, url: USERHOST_URL + '/' + id + '/index.html' })
  }).catch(err => console.error('[showcase] bot trigger:', err.message));

  res.json({ id });
});

app.get('/run/:id', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'run.html'));
});

app.get('/api/result/:id', (req, res) => {
  const file = path.join(REPORTS_DIR, req.params.id + '.json');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'not found' });
  try {
    res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch (e) {
    res.status(500).json({ error: 'bad report' });
  }
});

app.get('/result/:id', (req, res) => {
  if (req.session.user !== ADMIN_USER) {
    return res.status(403).send('Forbidden');
  }
  const guess = String(req.query.password || '');
  let matched = 0;
  for (let i = 0; i < ADMIN_PASSWORD.length; i++) {
    if (i >= guess.length) break;
    if (guess[i] === ADMIN_PASSWORD[i]) matched++;
    else break;
  }
  let iframes = '';
  for (let i = 0; i < matched; i++) {
    iframes += '<iframe style="display:none" src="about:blank"></iframe>';
  }
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.send('<!doctype html><html><body>' + iframes + '</body></html>');
});


// ---------------------------------------------------------------------------
// /report/:id — the player's uploaded HTML calls this to send back findings.
// Guarded by a time window and a per-submission cap; no token, because the
// player's page runs cross-origin and cannot send custom headers.
// ---------------------------------------------------------------------------
const REPORT_WINDOW_MS = 10 * 60 * 1000;   // accept reports within 10 minutes
const REPORT_MAX       = 200;              // cap reports per submission

app.post('/report/:id', express.text({ type: '*/*', limit: '16kb' }), (req, res) => {
  const file = path.join(REPORTS_DIR, req.params.id + '.json');
  if (!fs.existsSync(file)) return res.status(404).end();

  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { data = { output: [] }; }

  if (!data.createdAt) {
    try { data.createdAt = fs.statSync(file).mtimeMs; }
    catch (e) { data.createdAt = Date.now(); }
  }
  if (Date.now() - data.createdAt > REPORT_WINDOW_MS) {
    return res.status(410).send('Too late');
  }

  if (!Array.isArray(data.output)) data.output = [];
  if (data.output.length >= REPORT_MAX) {
    return res.status(429).send('Too many');
  }

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  if (body) data.output.push(body);
  fs.writeFileSync(file, JSON.stringify(data));
  res.end('ok');
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log('[showcase] listening on http://0.0.0.0:' + PORT);
  console.log('[showcase] SECRET length: ' + ADMIN_PASSWORD.length);
});
