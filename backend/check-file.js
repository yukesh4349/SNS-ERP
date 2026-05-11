const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'firebase-service-account.json');
console.log('CWD:', process.cwd());
console.log('Target File:', file);
console.log('Exists:', fs.existsSync(file));
try {
  const content = fs.readFileSync(file, 'utf8');
  console.log('Read Success, Length:', content.length);
  JSON.parse(content);
  console.log('Parse Success');
} catch (e) {
  console.log('Error:', e.message);
}
