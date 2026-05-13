const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.homework.findMany().then(h => console.log(JSON.stringify(h, null, 2))).catch(e => console.error(e)).finally(() => p.$disconnect());
