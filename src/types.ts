import { JSONSchemaType } from 'ajv';
import { EncryptionStrategy } from './encryption';

export interface DBOptions<T = any> {
  dbPath?: string;
  backup?: BackupStrategy;
  schema?: JSONSchemaType<T>;
  encryption?: EncryptionStrategy;
}


export interface DBData {
  [key: string]: any;
}

export interface BackupStrategy {
  save: (data: any) => Promise<void>;
}

export interface NetworkBackupConfig {
  url: string;
  retries?: number;
  backupIntervalDays?:number,
  backupPath?: string;
}

export interface LocalBackupConfig {
  backupPath: string;
  backupIntervalDays?:number,
  maxBackups?: number;
}

export interface NetworkBackupResponse {
  success: boolean;
  message: string;
  backupId?: string;
}

// Define a type for the JSON schema
export type JSONSchema = {
  [key: string]: any;
};

// Define a type for the schema
export type SchemaType<T> = JSONSchemaType<T>;

export interface JsonOperations {
  read(filePath: string): Promise<any>;
  write(filePath: string, data: any): Promise<void>;
  validate<T>(data: any, schema?: JSONSchemaType<T>): boolean;
}