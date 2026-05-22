require('./otel-setup');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8001;
const CHECKOUT_SERVICE_URL = process.env.CHECKOUT_SERVICE_URL || 'http://localhost:8002';

app.get('/checkout', async (req, res) => {
  const scenario = req.query.scenario || '';
  console.log(`[Gateway] Received request, scenario: ${scenario}`);
  
  try {
    const url = `${CHECKOUT_SERVICE_URL}/checkout?scenario=${scenario}`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error(`[Gateway] Error contacting Checkout Service: ${error.message}`);
    res.status(500).json({ error: 'Gateway failed to reach Checkout Service', message: error.message });
  }
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`[Gateway] Service running on port ${PORT}`);
});
