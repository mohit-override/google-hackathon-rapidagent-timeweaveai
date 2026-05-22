require('./otel-setup');
const express = require('express');
const api = require('@opentelemetry/api');
const app = express();
const PORT = process.env.PORT || 8004;

app.get('/get', async (req, res) => {
  const scenario = req.query.scenario || '';
  const key = req.query.key || '';
  console.log(`[Cache] Received GET request for key: ${key}, scenario: ${scenario}`);

  const activeSpan = api.trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.setAttribute('cache.key', key);
    activeSpan.setAttribute('cache.scenario', scenario);
  }

  // Simulate Cache Latency Scenario (2500ms delay, triggering Checkout client-side timeout of 1500ms)
  if (scenario === 'cache-latency' || scenario === 'cascading-failure') {
    console.log(`[Cache] Simulating cache latency spike (2500ms)...`);
    await new Promise(r => setTimeout(r, 2500));
  }

  res.json({
    key: key,
    value: `cached_session_data_for_${key}_ok`,
    status: 'HIT',
    ttl: 300,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`[Cache] Service running on port ${PORT}`);
});
