import { FastJsonDB } from './db';
import { useNetworkBackup, useLocalBackup } from './backup';

async function demo() {
  // Initialize database with network backup
  const db = new FastJsonDB({
    dbPath: 'mydb.json',
    /*backup: useNetworkBackup({
      url: 'https://your-backup-server.com/backup',
      retries: 3,
      backupPath: './backups' // Optional local fallback
    })*/
  });

  // Or with local backup
  const dbLocal = new FastJsonDB({
    dbPath: 'mydb-local.json',
   /* backup: useLocalBackup({
      backupPath: './backups',
      maxBackups: 5
    })*/
  });

  // Performance test
  console.log('Starting performance test...');

  // Write test
  const writeStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    await db.set(`key${i}`, { value: `value${i}` });
  }
  const writeEnd = performance.now();

  // Read test
  const readStart = performance.now();
  for (let i = 0; i < 10000; i++) {
    await db.get<{ value: string }>(`key${i % 1000}`);
  }
  const readEnd = performance.now();

  console.log(`Write speed: ${1000 / ((writeEnd - writeStart) / 1000)} ops/sec`);
  console.log(`Read speed: ${10000 / ((readEnd - readStart) / 1000)} ops/sec`);
}

demo().catch(console.error);