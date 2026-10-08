'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 9001;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const app = express();

app.use(function (req, res, next) {
  console.log('[userhost] ' + req.method + ' ' + req.url + ' host=' + req.hostname);
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});

app.get('/health', function (req, res) {
  res.json({ ok: true });
});

app.get('/:id/index.html', function (req, res) {
  const id = req.params.id;
  console.log('[userhost] id param = ' + JSON.stringify(id));

  // lenient: only block traversal
  if (!id || id.includes('/') || id.includes('..')) {
    return res.status(400).send('bad id');
  }

  const file = path.join(UPLOADS_DIR, id, 'index.html');
  if (!fs.existsSync(file)) {
    console.log('[userhost] file missing: ' + file);
    return res.status(404).send('not found');
  }

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.send(fs.readFileSync(file, 'utf8'));
});

app.get('/:id/', function (req, res) {
  res.redirect('/' + req.params.id + '/index.html');
});

app.listen(PORT, '0.0.0.0', function () {
  console.log('[userhost] listening on http://0.0.0.0:' + PORT);
});
