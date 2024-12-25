import { DatabaseDriver, DBOptions } from '../types/types';
import { JsonHandler } from './json';
import { SQLiteDriver } from './sqlite';

export function createDriver(options: DBOptions): DatabaseDriver {
  if (!options.driver || options.driver === 'json') {
    return new JsonHandler();
  }
  
  if (options.driver === 'sqlite') {
    return new SQLiteDriver(options);
  }
  
  if (typeof options.driver === 'object') {
    return options.driver;
  }
  
  throw new Error('Invalid driver specified');
} 