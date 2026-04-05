const express = require('express');
const { register, Counter, Gauge } = require('prom-client');

const app = express();
const port = 3000;

// Standard Prometheus metrics
const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Custom metric to trigger a "critical alert" for test purposes
const criticalAlertGauge = new Gauge({
  name: 'app_critical_alert',
  help: 'If 1, a critical alert is triggered. If 0, everything is fine.',
});

// Default to 0 (all clear)
criticalAlertGauge.set(0);

// Middleware to count requests
app.use((req, res, next) => {
  res.on('finish', () => {
    requestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
  });
  next();
});

// Metrics endpoint for Prometheus scraping
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Route to manually trigger a critical alert for testing
app.get('/trigger-alert', (req, res) => {
  criticalAlertGauge.set(1);
  console.log('⚠️ Critical alert triggered!');
  res.send('Critical alert triggered! Your monitoring system should respond.');
});

// Route to clear the alert
app.get('/clear-alert', (req, res) => {
  criticalAlertGauge.set(0);
  console.log('✅ Alert cleared.');
  res.send('Alert cleared.');
});

app.get('/', (req, res) => {
  res.send('<h1>Node.js Prometheus Metric App</h1><p>Use <code>/metrics</code> to see metrics.</p><p>Use <code>/trigger-alert</code> to set alert gauge to 1.</p><p>Use <code>/clear-alert</code> to reset it to 0.</p>');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
  console.log(`Metrics available at http://localhost:${port}/metrics`);
});
