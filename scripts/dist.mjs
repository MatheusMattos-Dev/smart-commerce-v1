// Monta a pasta dist/ com só o que o site publicado usa: a página e assets/.
// Os originais de img/, o src/ e o node_modules ficam de fora.
// Rodado pela Vercel depois do `npm run build` (veja vercel.json).
import { cpSync, rmSync } from 'node:fs';

const OUT = 'dist';
rmSync(OUT, { recursive: true, force: true });
cpSync('index.html', `${OUT}/index.html`);
cpSync('assets', `${OUT}/assets`, { recursive: true });
console.log(`${OUT}/ pronta`);
