import fs from 'fs';
import Ajv from 'ajv';
import {SchemaType, JsonOperations } from './types';

export class JsonHandler implements JsonOperations {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv();
  }

  async read(filePath: string): Promise<any> {
    try {
      const data = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      throw err;
    }
  }

  async write(filePath: string, data: any): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonString);
  }

  validate<T>(data: any, schema?: SchemaType<T>): boolean {
    if (!schema) return true;
    
    const validate = this.ajv.compile(schema);
    return validate(data);
  }
}
