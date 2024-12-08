
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
  const salt = config.salt || crypto.getRandomValues(new Uint8Array(16)).toString();
  let key: ArrayBuffer | null = null;

  const generateKey = async (): Promise<ArrayBuffer> => {
    if (!key) {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(config.password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      key = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: encoder.encode(salt),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );
    }
    return key;
  };

  return {
    async encrypt(data: any): Promise<EncryptedData> {
      const key = await generateKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(JSON.stringify(data));

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        cryptoKey,
        encodedData
      );

      return {
        encrypted: Buffer.from(encrypted).toString('hex'),
        iv: Buffer.from(iv).toString('hex'),
        authTag: '', // AES-GCM in WebCrypto handles the auth tag internally
        salt
      };
    },

    async decrypt(encryptedData: EncryptedData): Promise<any> {
      const key = await generateKey();
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: Buffer.from(encryptedData.iv, 'hex'),
        },
        cryptoKey,
        Buffer.from(encryptedData.encrypted, 'hex')
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    }
  };
};