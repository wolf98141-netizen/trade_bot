const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60
}));

const allowedIntervals = ['1m','3m','5m','15m','30m','1h','2h','4h','6h','12h','1d','1w'];

// 2. Routes (Must be before app.listen)
app.get('/', (req, res) => {
  res.send('Binance proxy running');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/klines', async (req, res) => {
  const { symbol, interval, limit } = req.query;

  if (!symbol || !interval) {
    return res.status(400).json({ error: 'Missing symbol or interval' });
  }

  if (!allowedIntervals.includes(interval)) {
    return res.status(400).json({ error: 'Invalid interval' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Try changing to .us if .com continues to return 451 on Render
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit || 100}`;

    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!r.ok) {
      // This will help you see the 451 error in your logs
      const errText = await r.text();
      return res.status(r.status).json({ error: `Binance Error: ${r.status}`, details: errText });
    }

    const data = await r.json();
    res.set('Cache-Control', 'public, max-age=5');
    res.json(data);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Start Server
app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
