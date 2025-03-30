import { SagaDB } from './db.ts';
import { readdirSync } from 'fs';
import { join } from 'path';
import { Glob } from 'bun';


export { SagaDB };


export * from './types/types.js';


const glob = new Glob('**/*.ts');


(async () => {
  const entrypoints = await Array.fromAsync(glob.scan({ cwd: './src' }));


  await Bun.build({
    target: 'bun',
    entrypoints: [
      './src/db.ts',
      './src/index.ts',
      './src/util/backup.ts',
      './src/util/encryption.ts',
      './src/types/types.ts',
      './src/database/driver.ts',
      './src/database/json.ts',
      './src/database/sqlite.ts'
    ],
    outdir: './dist',
    format: 'esm',
  });
})();