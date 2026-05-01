const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
 
const app = express();
app.use(cors());
 
app.get('/klines', async (req, res) => {
  const { symbol, interval, limit } = req.query;
  if (!symbol || !interval) {
    return res.status(400).json({ error: 'Missing symbol or interval' });
  }
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit || 100}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Binance returned ${r.status}`);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
 
app.get('/health', (req, res) => res.json({ status: 'ok' }));
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
 
