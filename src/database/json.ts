import Ajv from 'ajv';
import { SchemaType, DatabaseDriver, DBData, DBOptions } from '../types/types';

export class JsonHandler implements DatabaseDriver {
  private ajv: Ajv;
  private filePath: string;
  private memoryCache: DBData = {};
  private writeQueue: DBData = {};
  private queueTimeout: Timer | null = null;
  private initialized = false;

  constructor(options: DBOptions = {}) {
    this.ajv = new Ajv();
    this.filePath = options.dbPath || 'db.json';
  }

  private async initialize() {
    if (!this.initialized) {
      this.memoryCache = await this.readFile();
      this.initialized = true;
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    await this.initialize();
    return (this.writeQueue[key] || this.memoryCache[key]) as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<T> {
    await this.initialize();
    this.writeQueue[key] = value;
    this.memoryCache[key] = value;

    if (Object.keys(this.writeQueue).length >= 1000) {
      await this.flushQueue();
    } else {
      this.scheduleFlush();
    }

    return value;
  }

  private scheduleFlush() {
    if (this.queueTimeout) {
      clearTimeout(this.queueTimeout);
    }
    this.queueTimeout = setTimeout(() => this.flushQueue(), 100);
  }

  private async flushQueue() {
    if (Object.keys(this.writeQueue).length === 0) return;

    const newData = { ...this.memoryCache };
    this.writeQueue = {};
    await this.write(this.filePath, newData);
  }

  async delete(key: string): Promise<void> {
    await this.initialize();
    delete this.memoryCache[key];
    this.writeQueue[key] = undefined;
    this.scheduleFlush();
  }

  async getAll(): Promise<DBData> {
    await this.initialize();
    return { ...this.memoryCache };
  }

  private async readFile(): Promise<DBData> {
    try {
      const fileExists = await Bun.file(this.filePath).exists();
      if (!fileExists) return {};
      
      const data = await Bun.file(this.filePath).text();
      return JSON.parse(data);
    } catch (err) {
      return {};
    }
  }

  private async write(filePath: string, data: any): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    await Bun.write(filePath, jsonString);
  }

  validate<T>(data: any, schema?: SchemaType<T>): boolean {
    if (!schema) return true;
    const validate = this.ajv.compile(schema);
    return validate(data);
  }
}
