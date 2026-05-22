require('./otel-setup');
const express = require('express');
const api = require('@opentelemetry/api');
const app = express();
const PORT = process.env.PORT || 8002;
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:8003';
const REDIS_CACHE_SERVICE_URL = process.env.REDIS_CACHE_SERVICE_URL || 'http://localhost:8004';

app.get('/checkout', async (req, res) => {
  const scenario = req.query.scenario || '';
  console.log(`[Checkout] Received request, scenario: ${scenario}`);
  
  // 1. Call Cache
  let cacheSuccess = false;
  let cacheError = '';
  try {
    const cacheUrl = `${REDIS_CACHE_SERVICE_URL}/get?key=user_session&scenario=${scenario}`;
    console.log(`[Checkout] Calling Cache: ${cacheUrl}`);
    const cacheRes = await fetch(cacheUrl, { signal: AbortSignal.timeout(1500) });
    if (cacheRes.ok) {
      cacheSuccess = true;
    } else {
      cacheError = `Cache returned status ${cacheRes.status}`;
    }
  } catch (err) {
    cacheError = err.message;
    console.error(`[Checkout] Cache service error: ${err.message}`);
  }
  
  // 2. Call Payment
  let paymentSuccess = false;
  let paymentAttempts = 0;
  let paymentMessage = '';
  
  // Under retry storm, we retry 3 times. Otherwise, we do 1 attempt (0 retries).
  const maxRetries = scenario === 'retry-storm' ? 3 : 0;
  
  for (let i = 0; i <= maxRetries; i++) {
    paymentAttempts++;
    try {
      console.log(`[Checkout] Calling Payment (Attempt ${paymentAttempts}/${maxRetries + 1})`);
      const paymentUrl = `${PAYMENT_SERVICE_URL}/pay?scenario=${scenario}`;
      
      const paymentRes = await fetch(paymentUrl, { signal: AbortSignal.timeout(1500) });
      if (paymentRes.ok) {
        paymentSuccess = true;
        paymentMessage = await paymentRes.text();
        break;
      } else {
        paymentMessage = `Payment failed with status ${paymentRes.status}`;
        if (i < maxRetries) {
          console.log(`[Checkout] Retrying payment in 200ms...`);
          await new Promise(r => setTimeout(r, 200));
        }
      }
    } catch (err) {
      paymentMessage = err.message;
      console.error(`[Checkout] Payment attempt failed: ${err.message}`);
      if (i < maxRetries) {
        console.log(`[Checkout] Retrying payment in 200ms...`);
        await new Promise(r => setTimeout(r, 200));
      }
    }
  }

  // Record instrumentation details in current span
  const activeSpan = api.trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.setAttribute('checkout.cache_success', cacheSuccess);
    activeSpan.setAttribute('checkout.payment_attempts', paymentAttempts);
    activeSpan.setAttribute('checkout.payment_success', paymentSuccess);
    activeSpan.setAttribute('checkout.scenario', scenario);
    
    if (cacheError) {
      activeSpan.setAttribute('checkout.cache_error', cacheError);
    }
    
    if (!paymentSuccess) {
      activeSpan.setStatus({
        code: api.SpanStatusCode.ERROR,
        message: paymentMessage
      });
    }
  }

  if (paymentSuccess && cacheSuccess) {
    res.json({
      status: 'success',
      cache: 'hit',
      payment: 'completed',
      attempts: paymentAttempts
    });
  } else {
    res.status(500).json({
      status: 'failed',
      cache: cacheSuccess ? 'hit' : 'miss',
      cacheError: cacheError || null,
      payment: paymentSuccess ? 'completed' : 'failed',
      paymentError: paymentSuccess ? null : paymentMessage,
      attempts: paymentAttempts
    });
  }
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`[Checkout] Service running on port ${PORT}`);
});
