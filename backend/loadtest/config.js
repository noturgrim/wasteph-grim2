/**
 * k6 Load Test Configuration
 * 
 * This configuration simulates 6 concurrent staff members using the WastePH system
 * to test if Render.com infrastructure ($7 backend + $6 PostgreSQL) can handle the load.
 */

// Backend URL - CHANGE THIS to your hosted Render.com URL
// Example: 'https://wasteph-backend.onrender.com/api'
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api';

// Test user credentials (created by seedLoadTestUsers.js)
export const TEST_USERS = [
  { email: 'loadtest1@wasteph.com', password: 'LoadTest@123', role: 'sales' },
  { email: 'loadtest2@wasteph.com', password: 'LoadTest@123', role: 'sales' },
  { email: 'loadtest3@wasteph.com', password: 'LoadTest@123', role: 'admin' },
  { email: 'loadtest4@wasteph.com', password: 'LoadTest@123', role: 'super_admin' },
  { email: 'loadtest5@wasteph.com', password: 'LoadTest@123', role: 'social_media' },
  { email: 'loadtest6@wasteph.com', password: 'LoadTest@123', role: 'sales' },
];

// Load test configuration
export const options = {
  // Stages: Ramp-up, sustain, ramp-down
  stages: [
    { duration: '30s', target: 6 },   // Ramp-up: 6 staff logging in over 30s
    { duration: '5m', target: 6 },    // Sustain: 6 staff working for 5 minutes
    { duration: '30s', target: 0 },   // Ramp-down: graceful shutdown
  ],

  // Performance thresholds - Test PASSES if these are met
  thresholds: {
    // HTTP request duration
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],  // 95% under 2s, 99% under 5s
    
    // HTTP request failed rate
    'http_req_failed': ['rate<0.05'],  // Error rate less than 5%
    
    // Specific checks
    'checks': ['rate>0.95'],  // 95% of checks should pass
    
    // Custom metrics per endpoint
    'login_duration': ['p(95)<1000'],  // Login should be fast
    'dashboard_duration': ['p(95)<2000'],  // Dashboard under 2s
    'leads_duration': ['p(95)<2000'],  // Lists under 2s
  },

  // Summary export
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Think time (pause between actions) - simulates realistic user behavior
export const THINK_TIME = {
  min: 2000,  // 2 seconds
  max: 5000,  // 5 seconds
};

// Request timeout
export const REQUEST_TIMEOUT = '30s';

// Test metadata
export const TEST_INFO = {
  name: 'WastePH Staff Load Test',
  description: 'Simulates 6 concurrent staff members using the system',
  infrastructure: {
    backend: 'Render.com $7/month (512MB RAM, shared CPU)',
    database: 'PostgreSQL $6/month',
    frontend: 'Static site',
  },
  virtualUsers: 6,
  duration: '6 minutes',
  expectedLoad: 'Realistic staff workflow with think time',
};
