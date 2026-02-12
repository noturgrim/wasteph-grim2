/**
 * k6 Load Test: Staff Workflow
 * 
 * Simulates realistic staff member workflows:
 * - Login
 * - View dashboard
 * - Browse leads, clients, proposals
 * - Check notifications
 * - Realistic think time between actions
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { 
  BASE_URL, 
  TEST_USERS, 
  options, 
  THINK_TIME, 
  REQUEST_TIMEOUT 
} from './config.js';

// Export options from config
export { options };

// Custom metrics
const loginDuration = new Trend('login_duration');
const dashboardDuration = new Trend('dashboard_duration');
const leadsDuration = new Trend('leads_duration');
const clientsDuration = new Trend('clients_duration');
const proposalsDuration = new Trend('proposals_duration');
const notificationsDuration = new Trend('notifications_duration');
const errorRate = new Rate('errors');

/**
 * Random think time (pause) between actions
 */
function thinkTime() {
  const duration = Math.random() * (THINK_TIME.max - THINK_TIME.min) + THINK_TIME.min;
  sleep(duration / 1000);
}

/**
 * Get CSRF token from cookies
 */
function getCsrfToken(cookies) {
  // Extract CSRF token if needed (adjust based on your implementation)
  return null; // Update if CSRF is required for GET requests
}

/**
 * Main test scenario - simulates a staff member's workflow
 */
export default function () {
  // Each VU (virtual user) gets assigned a user
  const userIndex = __VU - 1;
  const user = TEST_USERS[userIndex % TEST_USERS.length];
  
  let sessionCookie = null;
  let csrfToken = null;
  let authHeaders = {};

  // ======================
  // 1. LOGIN
  // ======================
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const loginParams = {
    headers: { 'Content-Type': 'application/json' },
    timeout: REQUEST_TIMEOUT,
    tags: { endpoint: 'login' },
  };

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    loginPayload,
    loginParams
  );

  loginDuration.add(loginRes.timings.duration);

  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'login returns user data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.user && body.user.email === user.email;
      } catch (e) {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    errorRate.add(1);
    console.error(`Login failed for ${user.email}: ${loginRes.status}`);
    return; // Exit this iteration if login fails
  }

  errorRate.add(0);

  // Extract session cookie
  const cookies = loginRes.cookies;
  if (cookies.auth_session) {
    sessionCookie = cookies.auth_session[0].value;
    authHeaders = {
      'Cookie': `auth_session=${sessionCookie}`,
    };
  }

  thinkTime(); // User takes time after logging in

  // ======================
  // 2. GET USER PROFILE
  // ======================
  const meRes = http.get(`${BASE_URL}/auth/me`, {
    headers: authHeaders,
    timeout: REQUEST_TIMEOUT,
    tags: { endpoint: 'me' },
  });

  check(meRes, {
    'got user profile': (r) => r.status === 200,
  }) || errorRate.add(1);

  thinkTime();

  // ======================
  // 3. VIEW DASHBOARD
  // ======================
  const dashboardEndpoint = user.role === 'super_admin' || user.role === 'admin' 
    ? `${BASE_URL}/dashboard/admin`
    : `${BASE_URL}/dashboard/sales`;

  const dashboardRes = http.get(dashboardEndpoint, {
    headers: authHeaders,
    timeout: REQUEST_TIMEOUT,
    tags: { endpoint: 'dashboard' },
  });

  dashboardDuration.add(dashboardRes.timings.duration);

  check(dashboardRes, {
    'dashboard loaded': (r) => r.status === 200,
    'dashboard has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body !== null;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);

  thinkTime();

  // ======================
  // 4. VIEW LEADS LIST
  // ======================
  const leadsRes = http.get(`${BASE_URL}/leads`, {
    headers: authHeaders,
    timeout: REQUEST_TIMEOUT,
    tags: { endpoint: 'leads' },
  });

  leadsDuration.add(leadsRes.timings.duration);

  const leadsCheck = check(leadsRes, {
    'leads list loaded': (r) => r.status === 200,
    'leads is array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch (e) {
        return false;
      }
    },
  });

  if (!leadsCheck) {
    errorRate.add(1);
  }

  // Extract a lead ID for detail view
  let leadId = null;
  try {
    const leadsData = JSON.parse(leadsRes.body);
    if (leadsData.length > 0) {
      leadId = leadsData[0].id;
    }
  } catch (e) {
    // Ignore parse errors
  }

  thinkTime();

  // ======================
  // 5. VIEW SPECIFIC LEAD (if available)
  // ======================
  if (leadId) {
    const leadDetailRes = http.get(`${BASE_URL}/leads/${leadId}`, {
      headers: authHeaders,
      timeout: REQUEST_TIMEOUT,
      tags: { endpoint: 'lead_detail' },
    });

    check(leadDetailRes, {
      'lead detail loaded': (r) => r.status === 200,
    }) || errorRate.add(1);

    thinkTime();
  }

  // ======================
  // 6. VIEW CLIENTS LIST
  // ======================
  const clientsRes = http.get(`${BASE_URL}/clients`, {
    headers: authHeaders,
    timeout: REQUEST_TIMEOUT,
    tags: { endpoint: 'clients' },
  });

  clientsDuration.add(clientsRes.timings.duration);

  check(clientsRes, {
    'clients list loaded': (r) => r.status === 200,
    'clients is array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);

  thinkTime();

  // ======================
  // 7. VIEW PROPOSALS LIST
  // ======================
  const proposalsRes = http.get(`${BASE_URL}/proposals`, {
    headers: authHeaders,
    timeout: REQUEST_TIMEOUT,
    tags: { endpoint: 'proposals' },
  });

  proposalsDuration.add(proposalsRes.timings.duration);

  check(proposalsRes, {
    'proposals list loaded': (r) => r.status === 200,
  }) || errorRate.add(1);

  thinkTime();

  // ======================
  // 8. VIEW NOTIFICATIONS
  // ======================
  const notificationsRes = http.get(`${BASE_URL}/notifications`, {
    headers: authHeaders,
    timeout: REQUEST_TIMEOUT,
    tags: { endpoint: 'notifications' },
  });

  notificationsDuration.add(notificationsRes.timings.duration);

  check(notificationsRes, {
    'notifications loaded': (r) => r.status === 200,
  }) || errorRate.add(1);

  thinkTime();

  // ======================
  // 9. CHECK UNREAD NOTIFICATION COUNT
  // ======================
  const unreadCountRes = http.get(`${BASE_URL}/notifications/unread-count`, {
    headers: authHeaders,
    timeout: REQUEST_TIMEOUT,
    tags: { endpoint: 'unread_count' },
  });

  check(unreadCountRes, {
    'unread count loaded': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Longer think time before next iteration (simulates user working on something)
  sleep(3);
}

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log('='.repeat(60));
  console.log('🚀 Starting WastePH Load Test');
  console.log('='.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Virtual Users: 6 concurrent staff members`);
  console.log(`Duration: 6 minutes (30s ramp-up + 5min sustain + 30s ramp-down)`);
  console.log(`Test Users: ${TEST_USERS.length}`);
  console.log('='.repeat(60));
  console.log('');
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  console.log('');
  console.log('='.repeat(60));
  console.log('✅ Load Test Complete');
  console.log('='.repeat(60));
  console.log('Check the summary below for results.');
  console.log('');
}

/**
 * Handle Summary - Generate HTML report
 * This function is called by k6 after the test to generate custom output formats
 */
export function handleSummary(data) {
  // Determine which report file to generate based on environment variable
  const reportType = __ENV.REPORT_TYPE || 'standard';
  let reportFile = 'load-test-report.html';
  
  if (reportType === '100') {
    reportFile = 'load-test-report-100.html';
  } else if (reportType === '500') {
    reportFile = 'load-test-report-500.html';
  }

  return {
    [reportFile]: generateHtmlReport(data, reportType),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

/**
 * Text summary for console output
 */
function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}█ THRESHOLDS\n`;
  
  // Display threshold results
  for (const [name, value] of Object.entries(data.metrics)) {
    if (value.thresholds) {
      for (const [thresholdName, thresholdResult] of Object.entries(value.thresholds)) {
        const status = thresholdResult.ok ? '✓' : '✗';
        summary += `${indent}${status} ${name} ${thresholdName}\n`;
      }
    }
  }
  
  return summary;
}

/**
 * Generate HTML report
 */
function generateHtmlReport(data, reportType) {
  const testDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const duration = data.state.testRunDurationMs / 1000;
  const durationMin = Math.floor(duration / 60);
  const durationSec = Math.floor(duration % 60);

  // Determine dataset info based on report type
  let datasetInfo = '10 inquiries, 20 leads, 10 clients';
  let reportTitle = 'WastePH Infrastructure Load Test Report';
  let reportSubtitle = 'Standard Test - Performance Analysis';
  
  if (reportType === '100') {
    datasetInfo = '100 inquiries, 100 leads, 100 clients';
    reportSubtitle = '100 Records Dataset - Performance Analysis';
  } else if (reportType === '500') {
    datasetInfo = '500 inquiries, 500 leads, 500 clients';
    reportTitle = 'WastePH Infrastructure Stress Test Report';
    reportSubtitle = '500 Records Dataset - High Load Performance Analysis';
  }

  // Calculate key metrics
  const metrics = data.metrics;
  const httpReqDuration = metrics.http_req_duration;
  const httpReqFailed = metrics.http_req_failed;
  const checks = metrics.checks;
  const iterations = metrics.iterations;
  const vus = metrics.vus;

  const p95 = httpReqDuration ? httpReqDuration.values['p(95)'].toFixed(2) : 'N/A';
  const p99 = httpReqDuration ? httpReqDuration.values['p(99)'].toFixed(2) : 'N/A';
  const errorRate = httpReqFailed ? (httpReqFailed.values.rate * 100).toFixed(2) : 'N/A';
  const checkRate = checks ? (checks.values.rate * 100).toFixed(2) : 'N/A';
  const iterationCount = iterations ? iterations.values.count : 'N/A';
  const requestCount = metrics.http_reqs ? metrics.http_reqs.values.count : 'N/A';

  // Determine pass/fail status
  const p95Threshold = 2000;
  const p99Threshold = 5000;
  const errorThreshold = 5;
  const checkThreshold = 95;

  const p95Pass = parseFloat(p95) < p95Threshold;
  const p99Pass = parseFloat(p99) < p99Threshold;
  const errorPass = parseFloat(errorRate) < errorThreshold;
  const checkPass = parseFloat(checkRate) > checkThreshold;

  const allPassed = p95Pass && p99Pass && errorPass && checkPass;
  const statusBadge = allPassed ? 'PASSED' : 'FAILED';
  const statusColor = allPassed ? '#10b981' : '#ef4444';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportTitle}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 40px;
            border-bottom: 4px solid ${statusColor};
        }
        .header h1 {
            font-family: 'Montserrat', sans-serif;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .header .subtitle {
            font-size: 16px;
            color: #cbd5e1;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin-top: 12px;
            background: ${statusColor};
            color: white;
        }
        .content {
            padding: 40px;
        }
        .test-info {
            background: #f1f5f9;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #3b82f6;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .info-item .label {
            font-weight: 600;
            color: #475569;
        }
        .info-item .value {
            color: #1e293b;
            font-weight: 500;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            padding: 24px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            border-left: 4px solid ${allPassed ? '#10b981' : '#ef4444'};
        }
        .metric-card .metric-name {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .metric-card .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
            font-family: 'Montserrat', sans-serif;
        }
        .metric-card .metric-target {
            font-size: 12px;
            color: #64748b;
        }
        .metric-card.${p95Pass ? 'success' : 'error'} {
            border-left-color: ${p95Pass ? '#10b981' : '#ef4444'};
        }
        .footer {
            background: #f8fafc;
            padding: 24px 40px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 13px;
        }
        h2 {
            font-family: 'Montserrat', sans-serif;
            font-size: 24px;
            margin-bottom: 20px;
            color: #0f172a;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${reportTitle}</h1>
            <div class="subtitle">${reportSubtitle}</div>
            <div class="status-badge">${statusBadge}</div>
        </div>

        <div class="content">
            <div class="test-info">
                <h2>Test Configuration</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="label">Test Date:</div>
                        <div class="value">${testDate}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Dataset Size:</div>
                        <div class="value">${datasetInfo}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Virtual Users:</div>
                        <div class="value">6 concurrent staff members</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Duration:</div>
                        <div class="value">${durationMin}m ${durationSec}s</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Total Requests:</div>
                        <div class="value">${requestCount}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Iterations:</div>
                        <div class="value">${iterationCount}</div>
                    </div>
                </div>
            </div>

            <h2>Key Performance Metrics</h2>
            <div class="metrics-grid">
                <div class="metric-card ${p95Pass ? 'success' : 'error'}">
                    <div class="metric-name">Response Time (p95)</div>
                    <div class="metric-value">${p95}ms</div>
                    <div class="metric-target">Target: &lt; 2000ms</div>
                </div>
                <div class="metric-card ${p99Pass ? 'success' : 'error'}">
                    <div class="metric-name">Response Time (p99)</div>
                    <div class="metric-value">${p99}ms</div>
                    <div class="metric-target">Target: &lt; 5000ms</div>
                </div>
                <div class="metric-card ${errorPass ? 'success' : 'error'}">
                    <div class="metric-name">Error Rate</div>
                    <div class="metric-value">${errorRate}%</div>
                    <div class="metric-target">Target: &lt; 5%</div>
                </div>
                <div class="metric-card ${checkPass ? 'success' : 'error'}">
                    <div class="metric-name">Check Success Rate</div>
                    <div class="metric-value">${checkRate}%</div>
                    <div class="metric-target">Target: &gt; 95%</div>
                </div>
            </div>
        </div>

        <div class="footer">
            Generated by k6 Load Testing Tool | WastePH Internal System | Railway.app Infrastructure
        </div>
    </div>
</body>
</html>`;
}
