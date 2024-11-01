import { promises as fs } from 'fs';
import NodeCache from 'node-cache';
import { DBOptions, DBData, BackupStrategy } from './types';
import { JsonHandler } from './json';

export class SagaDB {
  private dbPath: string;
  private backup?: BackupStrategy;
  private cache: NodeCache;
  private data: DBData;
  private initialized: boolean;
  private jsonHandler: JsonHandler;

  constructor(options: DBOptions<DBData> = {}) {
    this.dbPath = options.dbPath || 'saga.json';
    this.backup = options.backup;
    this.cache = new NodeCache({ stdTTL: 0 });
    this.data = {};
    this.initialized = false;
    this.jsonHandler = new JsonHandler();
  }

  private async init(): Promise<void> {
    try {
      this.data = await this.jsonHandler.read(this.dbPath);
      this.cache.mset(
        Object.entries(this.data).map(([k, v]) => ({ key: k, val: v }))
      );
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.save();
      } else {
        throw err;
      }
    }
    this.initialized = true;
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.initialized) await this.init();
    const cached = this.cache.get<T>(key);
    if (cached !== undefined) return cached;
    return this.data[key] as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<T> {
    if (!this.initialized) await this.init();
    this.data[key] = value;
    this.cache.set(key, value);
    await this.save();
    return value;
  }

  async delete(key: string): Promise<void> {
    if (!this.initialized) await this.init();
    delete this.data[key];
    this.cache.del(key);
    await this.save();
  }

  private async save(): Promise<void> {
    await this.jsonHandler.write(this.dbPath, this.data);
    
    if (this.backup) {
      try {
        await this.backup.save(this.data);
      } catch (error: unknown) {
        console.error('Backup failed:', error instanceof Error ? error.message : error);
      }
    }
  }
}
