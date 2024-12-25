import { Database } from 'bun:sqlite';
import { DBOptions, DBData, DatabaseDriver } from '../types/types';

export class SQLiteDriver implements DatabaseDriver {
  private db: Database;
  private tableName: string;
  private writeQueue: { key: string; value: string }[] = [];
  private queueTimeout: Timer | null = null;

  constructor(options: DBOptions = {}) {
    this.db = new Database(options.dbPath || 'db.sqlite');
    this.tableName = 'data';
    this.init();
  }

  private init() {
    this.db.run(`CREATE TABLE IF NOT EXISTS ${this.tableName} (key TEXT PRIMARY KEY, value TEXT)`);
    // Create index for faster reads
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_key ON ${this.tableName}(key)`);
    // Enable WAL mode for better write performance
    this.db.run('PRAGMA journal_mode = WAL');
    this.db.run('PRAGMA synchronous = NORMAL');
  }

  async get<T>(key: string): Promise<T | undefined> {
    const row = this.db.query(`SELECT value FROM ${this.tableName} WHERE key = ?`).get(key) as { value: string } | null;
    if (row) {
      return JSON.parse(row.value) as T;
    }
    return undefined;
  }

  async set<T>(key: string, value: T): Promise<T> {
    const valueStr = JSON.stringify(value);
    this.writeQueue.push({ key, value: valueStr });

    if (this.writeQueue.length >= 1000) {
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
    if (this.writeQueue.length === 0) return;

    const queue = this.writeQueue;
    this.writeQueue = [];

    this.db.transaction(() => {
      const stmt = this.db.prepare(`INSERT OR REPLACE INTO ${this.tableName} (key, value) VALUES (?, ?)`);
      for (const item of queue) {
        stmt.run(item.key, item.value);
      }
    })();
  }

  async delete(key: string): Promise<void> {
    this.db.run(`DELETE FROM ${this.tableName} WHERE key = ?`, [key]);
  }

  async getAll(): Promise<DBData> {
    const rows = this.db.query(`SELECT key, value FROM ${this.tableName}`).all();
    const data: DBData = {};
    for (const row of rows) {
      const typedRow = row as { key: string; value: string };
      data[typedRow.key] = JSON.parse(typedRow.value);
    }
    return data;
  }
}