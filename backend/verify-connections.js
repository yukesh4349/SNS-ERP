const { PrismaClient } = require('@prisma/client');
const http = require('http');

async function checkDatabase() {
  console.log('--- 1. Testing Database Connection via Prisma Service ---');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to database successfully.');
    
    const settings = await prisma.schoolSettings.findFirst();
    console.log('✅ Read SchoolSettings table successfully. School Name:', settings ? settings.name : 'None');
    
    const usersCount = await prisma.user.count();
    console.log('✅ Read User table successfully. Total Users:', usersCount);
    
    const announcementCount = await prisma.announcement.count();
    console.log('✅ Read Announcement table successfully. Total Announcements:', announcementCount);
  } catch (error) {
    console.error('❌ Database connection via Prisma failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkBackendEndpoints() {
  console.log('\n--- 2. Testing Frontend -> Backend connection ---');
  const loginData = JSON.stringify({
    email: 'admin@sns-erp.local',
    password: 'ChangeMe123!'
  });

  const req = http.request({
    hostname: '127.0.0.1',
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
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ Login to backend API /auth/login successful. Status:', res.statusCode);
        const session = JSON.parse(body);
        if (session.accessToken) {
          console.log('✅ Backend returned authorization JWT token successfully.');
          
          // Test another protected route
          const req2 = http.request({
            hostname: '127.0.0.1',
            port: 5000,
            path: '/dashboard/overview',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.accessToken}`
            }
          }, (res2) => {
            let body2 = '';
            res2.on('data', c => body2 += c);
            res2.on('end', () => {
              if (res2.statusCode === 200) {
                console.log('✅ Fetching overview statistics from /dashboard/overview successful.');
                const stats = JSON.parse(body2);
                console.log('✅ Backend returned system stats from database successfully:');
                console.log('   - Stats list:', JSON.stringify(stats.stats));
              } else {
                console.error('❌ Fetching overview statistics failed with status:', res2.statusCode);
              }
            });
          });
          req2.on('error', e => console.error('❌ Request to overview failed:', e.message));
          req2.end();
        }
      } else {
        console.error('❌ Login to backend API failed with status:', res.statusCode, body);
      }
    });
  });

  req.on('error', e => console.error('❌ Connection to backend API failed. Is backend running?', e.message));
  req.write(loginData);
  req.end();
}

async function run() {
  await checkDatabase();
  await checkBackendEndpoints();
}

run();
