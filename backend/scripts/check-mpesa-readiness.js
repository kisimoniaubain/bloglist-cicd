require('dotenv').config();

const baseUrl = (process.env.BACKEND_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const run = async () => {
  const url = `${baseUrl}/api/payment/mpesa/readiness`;
  const response = await fetch(url, { method: 'GET' });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.message || `Readiness request failed (${response.status}).`;
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }

  const mpesa = payload?.mpesa || {};
  const checks = Array.isArray(mpesa.checks) ? mpesa.checks : [];
  const ready = Boolean(mpesa.readyLiveCharge);
  const simulationEnabled = Boolean(mpesa.simulationEnabled);

  console.log(`\nM-Pesa Environment: ${mpesa.env || 'unknown'}`);
  console.log(`Simulation Enabled: ${simulationEnabled ? 'YES' : 'NO'}`);
  console.log(`Node Environment: ${mpesa.nodeEnv || 'unknown'}\n`);

  for (const check of checks) {
    const symbol = check?.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`${symbol}: ${check?.message || check?.key || 'Unknown check'}`);
  }

  console.log();

  if (ready) {
    console.log('✓ READY: Live M-Pesa debit is enabled.');
    console.log('You can now accept real payments.\n');
    return;
  }

  if (simulationEnabled) {
    console.log('ℹ INFO: Simulation mode is enabled for local testing.');
    console.log('STK prompts will return mock responses. No live charges.\n');
    return;
  }

  console.error('✗ NOT READY: Live M-Pesa debit is blocked until all checks pass.');
  console.error('Review the failed checks above and update .env configuration.\n');
  process.exit(1);
};

run().catch((error) => {
  console.error(`\n✗ FAIL: ${error.message}\n`);
  process.exit(1);
});
