import Ajv from 'ajv';
import { SchemaType, JsonOperations } from '../types/types';

export class JsonHandler implements JsonOperations {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv();
  }

  async read(filePath: string): Promise<any> {
    try {
      const fileExists = await Bun.file(filePath).exists();
      if (!fileExists) return {};
      
      const data = await Bun.file(filePath).text();
      return JSON.parse(data);
    } catch (err) {
      throw err;
    }
  }

  async write(filePath: string, data: any): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    await Bun.write(filePath, jsonString);
  }

  validate<T>(data: any, schema?: SchemaType<T>): boolean {
    if (!schema) return true;
    const validate = this.ajv.compile(schema);
    return validate(data);
  }
}
