# SagaDB 🚀

A high-performance, TypeScript-based JSON database with advanced caching and backup features.

## Features ✨

- 🔥 In-memory caching for blazing-fast reads
- 💾 Automatic local and network backups
- 🔄 Retry mechanism for network operations
- 📊 JSON Schema validation support
- 🎯 Type-safe operations with TypeScript
- ⚡ Asynchronous I/O operations

## Installation 📦

```bash
npm install sagadb
```

## Quick Start 🌟

```typescript
import { SagaDB } from './db';
import { useLocalBackup } from './backup';

// Initialize with local backup
const db = new SagaDB({
  dbPath: 'mydb.json',
  backup: useLocalBackup({
    backupPath: './backups',
    maxBackups: 5
  })
});

// Basic operations
await db.set('user:1', { name: 'John', age: 30 });
const user = await db.get('user:1');
await db.delete('user:1');
```

## Backup Strategies 🔒

### Local Backup 💻

```typescript
const db = new SagaDB({
  dbPath: 'mydb.json',
  backup: useLocalBackup({
    backupPath: './backups',
    maxBackups: 5
  })
});
```

### Network Backup ☁️

```typescript
const db = new SagaDB({
  dbPath: 'mydb.json',
  backup: useNetworkBackup({
    url: 'https://your-backup-server.com/backup',
    retries: 3,
    backupPath: './backups' // Optional local fallback
  })
});
```

## Performance 🏃‍♂️

The database utilizes Node-Cache for in-memory caching, providing:

- Lightning-fast read operations
- Efficient write operations with automatic backup
- Optimized for high-throughput scenarios

## Type Safety 🛡️

Built with TypeScript for complete type safety:

```typescript
interface User {
  name: string;
  age: number;
}

const user = await db.get<User>('user:1');
// user is typed as User | undefined
```

## Development 🛠️

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start the demo
npm start
```

## License 📄

MIT

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.
