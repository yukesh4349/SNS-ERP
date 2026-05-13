const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const c = await p.examSchedule.count();
    console.log('ExamSchedule count:', c);
  } catch (e) {
    console.error('ExamSchedule ERROR:', e.message);
  }
  try {
    const c = await p.announcement.count();
    console.log('Announcement count:', c);
  } catch (e) {
    console.error('Announcement ERROR:', e.message);
  }
  try {
    const c = await p.attendance.count();
    console.log('Attendance count:', c);
  } catch (e) {
    console.error('Attendance ERROR:', e.message);
  }
  try {
    const c = await p.examResult.count();
    console.log('ExamResult count:', c);
  } catch (e) {
    console.error('ExamResult ERROR:', e.message);
  }
  try {
    const c = await p.user.count();
    console.log('User count:', c);
  } catch (e) {
    console.error('User ERROR:', e.message);
  }
  await p.$disconnect();
}
main();
