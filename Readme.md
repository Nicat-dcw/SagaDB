# SagaDB 🚀

A high-performance, TypeScript-based JSON database with advanced caching and backup features, optimized for Bun runtime.

## Features ✨

- 🔥 In-memory caching for blazing-fast reads
- 💾 Automatic local and network backups
- 🔄 Retry mechanism for network operations
- 📊 JSON Schema validation support
- 🎯 Type-safe operations with TypeScript
- ⚡ Optimized for Bun runtime
- 🚄 Asynchronous I/O operations

## Installation 📦

```bash
bun add sagadb
```

## Benchmark 📊:
| Metric           | Speed                      | Time per Operation | Faster than 1 ms? |
|------------------|----------------------------|---------------------|--------------------|
| **Write Speed**  | 1,671.82 ops/sec           | 0.598 ms           | Yes               |
| **Read Speed**   | 292,315.74 ops/sec         | 0.00342 ms         | Yes               |

### Benchmark Summary
- **Write Speed**: The write operations are completed at a speed of approximately 1,671.82 operations per second, translating to 0.598 ms per operation.
- **Read Speed**: The read operations achieve an impressive speed of around 292,315.74 operations per second, or 0.00342 ms per operation.
- **Performance**: Both read and write operations are faster than 1 ms, making this JSON database module highly suitable for applications requiring quick data access.

## Quick Start 🌟

```typescript
import { SagaDB } from 'sagadb';
import { useLocalBackup } from 'sagadb/backup';

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
bun add

# Build the project
bun run build

# Run tests
bun test

# Start the demo
bun start
```

## License 📄

MIT

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.
