import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routes = [
  'about',
  'privacy',
  'terms',
  'contact',
  'disclaimer',
  'faq',
  'games/word-chain',
  'games/tic-tac-toe',
  'games/ludo',
  'games/number-recall',
  'games/cup-stack-battle',
  'games/word-chain/play',
  'games/tic-tac-toe/play',
  'games/ludo/play',
  'games/number-recall/play',
  'games/cup-stack-battle/play'
];

const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌ dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

const indexHtml = fs.readFileSync(indexPath, 'utf-8');

console.log('🚀 Generating static routes for SEO...');

routes.forEach(route => {
  const routePath = path.join(distPath, route);
  
  // Create directory recursively
  if (!fs.existsSync(routePath)) {
    fs.mkdirSync(routePath, { recursive: true });
  }
  
  // Create index.html in the route directory
  const routeIndexPath = path.join(routePath, 'index.html');
  fs.writeFileSync(routeIndexPath, indexHtml);
  
  console.log(`✅ Generated: ${route}/index.html`);
});

console.log('✨ SEO fix completed successfully!');
