const axios = require('axios');

// ─────────────────────────────────────────────
// Load threshold values from .env
// These decide if response is FAST, SLOW or CRITICAL
// ─────────────────────────────────────────────
const FAST    = parseInt(process.env.RESPONSE_TIME_FAST) || 2000;
const SLOW    = parseInt(process.env.RESPONSE_TIME_SLOW) || 5000;
const TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT)    || 5000;


// ─────────────────────────────────────────────
// HELPER: Decide response time label
// Input  : responseTime in milliseconds
// Output : 'FAST' | 'SLOW' | 'CRITICAL'
// ─────────────────────────────────────────────
function getResponseLabel(responseTime) {
  if (responseTime < FAST) return 'FAST';
  if (responseTime < SLOW) return 'SLOW';
  return 'CRITICAL';
}


// ─────────────────────────────────────────────
// HELPER: Check if HTTP status code means success
// Input  : statusCode (e.g. 200, 404, 500)
// Output : true | false
// 200-299 = success range in HTTP standard
// ─────────────────────────────────────────────
function isSuccessStatus(statusCode) {
  return statusCode >= 200 && statusCode < 300;
}


// ─────────────────────────────────────────────
// FUNCTION 1: Check a single API once
// Input  : url (string)
// Output : result object with status, responseTime etc.
// ─────────────────────────────────────────────
async function checkApi(url) {
  const startTime = Date.now(); // start timer

  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT // if no reply in 5s → throw error
    });

    const responseTime = Date.now() - startTime; // stop timer
    const success = isSuccessStatus(response.status);

    return {
      url,
      status        : success ? 'UP' : 'DOWN',
      statusCode    : response.status,
      responseTime,                              // in milliseconds
      responseLabel : getResponseLabel(responseTime),
      checkedAt     : new Date().toISOString(),
    };

  } catch (error) {
    // API didn't respond or returned error
    const responseTime = Date.now() - startTime;

    return {
      url,
      status        : 'DOWN',
      statusCode    : error.response?.status || null, // null if timeout
      responseTime,
      responseLabel : 'CRITICAL',
      error         : error.message,
      checkedAt     : new Date().toISOString(),
    };
  }
}


// ─────────────────────────────────────────────
// FUNCTION 2: Check ALL APIs from .env once
// Reads MONITOR_URLS from .env, checks each one
// Output : array of result objects
// ─────────────────────────────────────────────
async function checkAllApis() {
  const urls = process.env.MONITOR_URLS.split(',');
  const results = [];

  console.log(`\nChecking ${urls.length} APIs...\n`);

  for (const url of urls) {
    const result = await checkApi(url.trim());
    results.push(result);

    // log to terminal
    console.log(`[${result.status}] [${result.responseLabel}] ${result.url}`);
    console.log(`  Status Code   : ${result.statusCode}`);
    console.log(`  Response Time : ${result.responseTime}ms`);
    console.log(`  Checked At    : ${result.checkedAt}`);
    if (result.error) {
      console.log(`  Error         : ${result.error}`);
    }
    console.log('');
  }

  return results;
}


// ─────────────────────────────────────────────
// FUNCTION 3: Generate full health report for ONE url
// Calls that url N times, calculates:
//   - avg/min/max response time
//   - uptime percentage
//   - overall health status
// Input  : url, numberOfChecks (default 5)
// Output : detailed report object
// ─────────────────────────────────────────────
async function generateHealthReport(url, numberOfChecks = 5) {
  const checks = [];

  console.log(`\nRunning ${numberOfChecks} checks for: ${url}\n`);

  for (let i = 1; i <= numberOfChecks; i++) {
    console.log(`  Check ${i}/${numberOfChecks}...`);

    const result = await checkApi(url);
    checks.push(result);

    // wait 1 second between checks
    // so we don't spam the target API
    if (i < numberOfChecks) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // ── Calculate Statistics ──────────────────

  const totalChecks    = checks.length;
  const upChecks       = checks.filter((c) => c.status === 'UP').length;
  const downChecks     = totalChecks - upChecks;

  const responseTimes  = checks.map((c) => c.responseTime);
  const avgResponseTime = Math.round(
    responseTimes.reduce((a, b) => a + b, 0) / totalChecks
  );
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);

  const uptimePercent   = ((upChecks / totalChecks) * 100).toFixed(2);

  // overall speed label based on average response time
  const overallLabel = getResponseLabel(avgResponseTime);

  // overall health:
  // ALL up   → HEALTHY
  // ALL down → DOWN
  // some up  → DEGRADED
  const overallStatus =
    upChecks === totalChecks ? 'HEALTHY' :
    upChecks === 0           ? 'DOWN'    :
    'DEGRADED';

  return {
    url,
    overallStatus,                    // HEALTHY | DEGRADED | DOWN
    overallResponseLabel: overallLabel, // FAST | SLOW | CRITICAL

    summary: {
      totalChecks,
      upChecks,
      downChecks,
      uptimePercent : `${uptimePercent}%`,
    },

    responseTimes: {
      avg : `${avgResponseTime}ms`,
      min : `${minResponseTime}ms`,
      max : `${maxResponseTime}ms`,
    },

    checks,  // all individual check results

    reportGeneratedAt: new Date().toISOString(),
  };
}


// ─────────────────────────────────────────────
// Export all functions so other files can use them
// ─────────────────────────────────────────────
module.exports = { checkApi, checkAllApis, generateHealthReport };