import NodeCache from 'node-cache';
import { EncryptionStrategy } from './util/encryption';
import { DBOptions, DBData, BackupStrategy, DatabaseDriver } from './types/types';
import { createDriver } from './database/driver';

export class SagaDB {
  private driver: DatabaseDriver;
  private cache: NodeCache;
  private initialized: boolean = false;
  private data: DBData = {};

  constructor(options: DBOptions = {}) {
    this.cache = new NodeCache({ stdTTL: 0 });
    this.driver = createDriver(options);
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.initialized) await this.init();
    const cached = this.cache.get<T>(key);
    if (cached !== undefined) return cached;
    return this.driver.get<T>(key);
  }

  private async init(): Promise<void> {
    try {
      const data = await this.driver.getAll();
      this.cache.mset(
        Object.entries(data).map(([k, v]) => ({ key: k, val: v }))
      );
      this.initialized = true;
    } catch (err) {
      throw err;
    }
  }

  async set<T>(key: string, value: T): Promise<T> {
    if (!this.initialized) await this.init();
    this.data[key] = value;
    this.cache.set(key, value);
    await this.driver.set(key, value);
    return value;
  }

  async delete(key: string): Promise<void> {
    if (!this.initialized) await this.init();
    delete this.data[key];
    this.cache.del(key);
    await this.driver.delete(key);
  }
}