
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(cors());
app.use(express.json());

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60
}));

const allowedIntervals = [
  '1m','3m','5m','15m','30m',
  '1h','2h','4h','6h','12h',
  '1d','1w'
];

app.get('/klines', async (req, res) => {
  const { symbol, interval, limit } = req.query;

  if (!symbol || !interval) {
    return res.status(400).json({
      error: 'Missing symbol or interval'
    });
  }

  if (!allowedIntervals.includes(interval)) {
    return res.status(400).json({
      error: 'Invalid interval'
    });
  }

  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000);

    const url =
      `https://api.binance.com/api/v3/klines` +
      `?symbol=${symbol.toUpperCase()}` +
      `&interval=${interval}` +
      `&limit=${limit || 100}`;

    const r = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!r.ok) {
      throw new Error(`Binance returned ${r.status}`);
    }

    const data = await r.json();

    res.set('Cache-Control', 'public, max-age=5');

    res.json(data);

  } catch (e) {
    res.status(500).json({
      error: e.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('Binance proxy running');
});

app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});


 
