'use strict';

const express = require('express');
const puppeteer = require('puppeteer');

const PORT           = process.env.PORT || 9999;
const SHOWCASE_URL   = process.env.SHOWCASE_URL || 'http://localhost:9000';
const ADMIN_USER     = 'admin';
const ADMIN_PASS     = process.env.ADMIN_PASS || 'xxxxxxxxxxxxxxxxxxxxxxx';
const BOT_TIMEOUT_MS = parseInt(process.env.BOT_TIMEOUT_MS || '90000', 10);

const app = express();
app.use(express.json());

let busy = false;

app.post('/run', async function (req, res) {
  const body = req.body || {};
  if (!body.id || !body.url) return res.status(400).json({ error: 'id and url required' });
  if (busy) return res.status(429).json({ error: 'bot busy' });

  busy = true;
  res.json({ ok: true, queued: body.id });

  try {
    await runBot(body.id, body.url);
    console.log('[bot] finished ' + body.id);
  } catch (err) {
    console.error('[bot] error on ' + body.id + ':', err.message);
  } finally {
    busy = false;
  }
});

app.get('/health', function (req, res) { res.json({ ok: true, busy: busy }); });

app.listen(PORT, '0.0.0.0', function () {
  console.log('[bot] listening on :' + PORT);
  console.log('[bot] showcase=' + SHOWCASE_URL);
});

async function runBot(id, attackerUrl) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
      '--host-resolver-rules=MAP localhost host.docker.internal'
    ]
  });

  try {
    const page = await browser.newPage();

    await page.goto(SHOWCASE_URL + '/login', { waitUntil: 'domcontentloaded' });
    await page.type('input[name=username]', ADMIN_USER);
    await page.type('input[name=password]', ADMIN_PASS);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(function () {}),
      page.click('button[type=submit]')
    ]);

    console.log('[bot] logged in, visiting ' + attackerUrl);

    const attacker = await browser.newPage();
    attacker.on('console', function (m) { console.log('[bot:page] ' + m.text()); });
    attacker.on('pageerror', function (e) { console.log('[bot:pageerror] ' + e.message); });

    await attacker.goto(attackerUrl, { waitUntil: 'domcontentloaded' });

    await new Promise(function (r) { setTimeout(r, BOT_TIMEOUT_MS); });
  } finally {
    await browser.close();
  }
}
