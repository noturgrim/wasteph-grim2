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
