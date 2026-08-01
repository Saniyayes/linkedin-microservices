import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

const registerTrend = new Trend('register_duration', true);
const loginTrend = new Trend('login_duration', true);
const feedTrend = new Trend('feed_duration', true);
const postTrend = new Trend('create_post_duration', true);

export const options = {
  scenarios: {
    ramping_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
    login_duration: ['p(95)<500'],
    feed_duration: ['p(95)<400'],
  },
};

export function setup() {
  const email = `loadtest_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
  const password = 'LoadTest123!';

  const res = http.post(`${BASE_URL}/api/users/register`, JSON.stringify({
    name: 'Load Test User', email, password,
  }), { headers: { 'Content-Type': 'application/json' } });

  registerTrend.add(res.timings.duration);
  check(res, { 'setup register succeeded (200)': (r) => r.status === 200 });

  const body = res.json();
  return { email, password, userId: body.userId };
}

export default function (data) {
  let token;

  group('login', () => {
    const res = http.post(`${BASE_URL}/api/users/login`, JSON.stringify({
      email: data.email, password: data.password,
    }), { headers: { 'Content-Type': 'application/json' } });

    loginTrend.add(res.timings.duration);
    check(res, {
      'login status 200': (r) => r.status === 200,
      'login returns token': (r) => !!r.json('token'),
    });
    token = res.json('token');
  });

  if (!token) { sleep(1); return; }

  const authHeaders = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };

  group('read feed', () => {
    const res = http.get(`${BASE_URL}/api/posts`, authHeaders);
    feedTrend.add(res.timings.duration);
    check(res, { 'posts status 200': (r) => r.status === 200 });
  });

  group('create post', () => {
    const res = http.post(`${BASE_URL}/api/posts`, JSON.stringify({
      authorId: data.userId, authorName: 'Load Test User', content: `Load test post at ${Date.now()}`,
    }), authHeaders);
    postTrend.add(res.timings.duration);
    check(res, { 'post created (200)': (r) => r.status === 200 });
  });

  group('view own profile', () => {
    const res = http.get(`${BASE_URL}/api/users/${data.userId}`, authHeaders);
    check(res, { 'profile status 200': (r) => r.status === 200 });
  });

  sleep(1);
}
