// Confere se a cópia do schema Zod no admin continua igual à do site.
// Rode depois de mudar web/src/lib/schema.ts: `npm run checar-schema`.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arquivoSite = path.join(raiz, '..', 'web', 'src', 'lib', 'schema.ts');
const arquivoAdmin = path.join(raiz, 'src', 'lib', 'schema.ts');

const normalizar = (texto) => texto.replace(/\r\n/g, '\n').trim();

const [site, admin] = await Promise.all([
  readFile(arquivoSite, 'utf8'),
  readFile(arquivoAdmin, 'utf8'),
]);

if (normalizar(site) !== normalizar(admin)) {
  console.error(
    [
      'O schema do admin está diferente do site.',
      `Origem: ${arquivoSite}`,
      `Cópia:  ${arquivoAdmin}`,
      '',
      'Copie o arquivo do site para o admin e revise os tipos do painel:',
      `  cp ${arquivoSite} ${arquivoAdmin}`,
    ].join('\n'),
  );
  process.exit(1);
}

console.log('Schema do admin idêntico ao do site.');
