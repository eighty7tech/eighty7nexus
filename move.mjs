import fs from 'fs';
import path from 'path';

const adminDir = path.join(process.cwd(), 'app', '[locale]', 'admin');
const dashboardDir = path.join(adminDir, '(dashboard)');

if (!fs.existsSync(dashboardDir)) {
  fs.mkdirSync(dashboardDir);
}

const items = fs.readdirSync(adminDir);

for (const item of items) {
  if (item === 'login' || item === '(dashboard)') continue;
  
  const oldPath = path.join(adminDir, item);
  const newPath = path.join(dashboardDir, item);
  
  fs.renameSync(oldPath, newPath);
  console.log(`Moved ${item} to (dashboard)`);
}
