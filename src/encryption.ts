import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const algorithm = 'aes-256-gcm';
const scryptAsync = promisify(scrypt);

export interface EncryptionConfig {
  password: string;
  salt?: string;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
}

export interface EncryptionStrategy {
  encrypt(data: any): Promise<EncryptedData>;
  decrypt(encryptedData: EncryptedData): Promise<any>;
}

export const useEncryption = (config: EncryptionConfig): EncryptionStrategy => {
  let key: Buffer | null = null;
  const salt = config.salt || randomBytes(16).toString('hex');

  const generateKey = async (): Promise<Buffer> => {
    if (!key) {
      key = (await scryptAsync(config.password, salt, 32)) as Buffer;
    }
    return key;
  };

  return {
    async encrypt(data: any): Promise<EncryptedData> {
      const key = await generateKey();
      const iv = randomBytes(16);
      const cipher = createCipheriv(algorithm, key, iv);
      
      const jsonString = JSON.stringify(data);
      const encrypted = Buffer.concat([
        cipher.update(jsonString, 'utf8'),
        cipher.final()
      ]);

      return {
        encrypted: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        authTag: cipher.getAuthTag().toString('hex'),
        salt
      };
    },

    async decrypt(encryptedData: EncryptedData): Promise<any> {
      const key = await generateKey();
      const decipher = createDecipheriv(
        algorithm,
        key,
        Buffer.from(encryptedData.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData.encrypted, 'hex')),
        decipher.final()
      ]);

      return JSON.parse(decrypted.toString('utf8'));
    }
  };
};