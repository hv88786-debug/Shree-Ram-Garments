// Build: compile Tailwind -> dist/assets/styles.css and copy the static site into dist/.
import { execSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/assets', { recursive: true });

for (const f of ['index.html', 'shop.html', 'product.html']) cpSync(f, `dist/${f}`);
cpSync('assets', 'dist/assets', { recursive: true });

execSync('npx tailwindcss -c tailwind.config.js -i src/input.css -o dist/assets/styles.css --minify', { stdio: 'inherit' });

if (!existsSync('dist/assets/styles.css')) { console.error('styles.css was not generated'); process.exit(1); }
console.log('Build OK -> dist/');
