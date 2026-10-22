import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
// Vercel sets NODE_ENV=production; interaction tests require React's test build.
// Scope the override to Vitest so the subsequent app build stays production.
const cli=fileURLToPath(new URL('../node_modules/vitest/vitest.mjs',import.meta.url));
const result=spawnSync(process.execPath,[cli,'run','tests',...process.argv.slice(2)],{
 stdio:'inherit',env:{...process.env,NODE_ENV:'test'}
});
if(result.error){console.error('Não foi possível iniciar os testes.');process.exit(1)}
process.exit(result.status??1);
