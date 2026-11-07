// CyberQuest's small static web server. Runtime settings come from the host.
const express = require('express');
const path = require('path');

const app = express();
let PORT = Number(process.env.PORT || 3000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT must be a whole number from 1 to 65535.');
}
const ROOT = __dirname;

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebase.com",
    "frame-src https://*.firebaseapp.com https://www.google.com https://www.recaptcha.net",
    'upgrade-insecure-requests'
  ].join('; '));
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.get('/api/animations', (req, res) => {
  res.json({
    framework: 'CyberFX CSS animation engine',
    presets: {
      pulse: { cssClass: 'anim-cyber-pulse', duration: '2.4s' },
      pop: { cssClass: 'anim-pop', duration: '0.35s' },
      confetti: { jsTrigger: 'CyberFX.confetti()' }
    }
  });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

for (const directory of ['assets', 'styles', 'js']) {
  app.use(`/${directory}`, express.static(path.join(ROOT, directory), {
    dotfiles: 'deny',
    index: false,
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
  }));
}

app.get('*', (req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Request failed.');
  return res.status(500).json({ error: 'The request could not be completed.' });
});

function listen(port) {
  const s = app.listen(port, '0.0.0.0', () => {
    console.log(`\n  ╔══════════════════════════════════════════════════════════╗`);
    console.log(`  ║  🛡️   CYBERSHIELD / CYBERQUEST GAME HUB RUNNING          ║`);
    console.log(`  ╠══════════════════════════════════════════════════════════╣`);
    console.log(`  ║  🌐  URL: http://localhost:${port}                           ║`);
    console.log(`  ╚══════════════════════════════════════════════════════════╝\n`);
  });

  s.on('error', (err) => {
    if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
      const nextPort = port === 3000 ? 5000 : port + 1;
      console.warn(`[Port ${port} unavailable (${err.code}), trying port ${nextPort}...]`);
      listen(nextPort);
    } else {
      console.error('Server error:', err);
    }
  });
}

listen(PORT);

module.exports = app;
