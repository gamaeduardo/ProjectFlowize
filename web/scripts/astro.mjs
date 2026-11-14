import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Roda a CLI do Astro carregando o loader que troca o compilador nativo pelo
 * WASM. Necessário em CPUs x64 sem AVX2, onde o binding nativo morre com SIGILL.
 */
const loader = new URL('./register-wasi.mjs', import.meta.url).href;
const nodeOptions = [process.env.NODE_OPTIONS, `--import=${loader}`]
  .filter(Boolean)
  .join(' ');

const astroBin = fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url));

const filho = spawn(process.execPath, [astroBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
});

filho.on('exit', (codigo) => process.exit(codigo ?? 1));
