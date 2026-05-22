require('./otel-setup');
const express = require('express');
const api = require('@opentelemetry/api');
const app = express();
const PORT = process.env.PORT || 8003;

app.get('/pay', async (req, res) => {
  const scenario = req.query.scenario || '';
  console.log(`[Payment] Received request, scenario: ${scenario}`);
  
  const activeSpan = api.trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.setAttribute('payment.scenario', scenario);
  }

  // 1. Simulate Latency / Timeout Propagation
  if (scenario === 'payment-timeout' || scenario === 'cascading-failure') {
    console.log(`[Payment] Simulating latency spike (4000ms)...`);
    await new Promise(r => setTimeout(r, 4000));
  }
  
  // 2. Simulate Retry Storm (Fail all attempts with a 500 error)
  if (scenario === 'retry-storm') {
    console.log(`[Payment] Simulating failure for retry-storm (500 Error)...`);
    if (activeSpan) {
      activeSpan.setStatus({
        code: api.SpanStatusCode.ERROR,
        message: 'Payment database connection pool saturated'
      });
    }
    return res.status(500).json({ error: 'Database connection pool saturated', code: 'POOL_EXHAUSTED' });
  }

  const txId = 'TX-' + Math.floor(Math.random() * 900000 + 100000);
  console.log(`[Payment] Transaction completed: ${txId}`);
  
  res.json({
    transactionId: txId,
    status: 'approved',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`[Payment] Service running on port ${PORT}`);
});
