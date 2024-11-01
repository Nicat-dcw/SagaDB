import { promises as fs } from 'fs';
import NodeCache from 'node-cache';
import { EncryptionStrategy, EncryptionConfig } from './util/encryption';
import { DBOptions, DBData, BackupStrategy } from './types/types';

import { JsonHandler } from './database/json';
import { useNetworkBackup, useLocalBackup } from './util/backup';
import { useEncryption } from './util/encryption'

export class SagaDB {
  private dbPath: string;
  private backup?: BackupStrategy;
  private cache: NodeCache;
  private data: DBData;
  private initialized: boolean;
  private jsonHandler: JsonHandler;
  private encryption?: EncryptionStrategy;

  constructor(options?: DBOptions = {}) {
    this.dbPath = options.dbPath || 'db.json';
    this.backup = options.backup;
    this.cache = new NodeCache({ stdTTL: 0 });
    this.data = {};
    this.initialized = false;
    this.jsonHandler = new JsonHandler();
    this.encryption = options.encryption;
  }

  private async init(): Promise<void> {
    try {
      let fileData = await this.jsonHandler.read(this.dbPath);
      
      if (this.encryption && Object.keys(fileData).length > 0) {
        fileData = await this.encryption.decrypt(fileData);
      }
      
      this.data = fileData;
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
    let dataToSave = this.data;
    
    if (this.encryption) {
      dataToSave = await this.encryption.encrypt(this.data);
    }
    
    await this.jsonHandler.write(this.dbPath, dataToSave);
    
    if (this.backup) {
      try {
        await this.backup.save(dataToSave);
      } catch (error:any) {
        console.error('Backup failed:', error.message);
      }
    }
  }
}

export { useLocalBackup, useNetworkBackup,useEncryption }