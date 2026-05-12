const http = require('http');

// Step 1: Login as admin
const loginData = JSON.stringify({
  email: 'admin@sns-erp.local',
  password: 'ChangeMe123!'
});

const loginReq = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData),
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Login status:', res.statusCode);
    if (res.statusCode !== 201 && res.statusCode !== 200) {
      console.log('Login response:', body);
      return;
    }
    const session = JSON.parse(body);
    console.log('Logged in as:', session.user?.name, '| role:', session.user?.role);
    const token = session.accessToken;

    // Step 2: Test the endpoints
    const endpoints = [
      '/announcements?skip=0&take=5',
      '/exams/schedule?class=12&section=A',
    ];

    endpoints.forEach(ep => {
      const req2 = http.request({
        hostname: 'localhost',
        port: 5000,
        path: ep,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }, (res2) => {
        let b = '';
        res2.on('data', c => b += c);
        res2.on('end', () => {
          console.log(`\n[${res2.statusCode}] ${ep}:`);
          try {
            const parsed = JSON.parse(b);
            console.log(JSON.stringify(parsed).substring(0, 200));
          } catch {
            console.log(b.substring(0, 200));
          }
        });
      });
      req2.on('error', e => console.error(`Error on ${ep}:`, e.message));
      req2.end();
    });
  });
});

loginReq.on('error', e => console.error('Login error:', e.message));
loginReq.write(loginData);
loginReq.end();
