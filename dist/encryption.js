"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEncryption = void 0;
const crypto_1 = require("crypto");
const util_1 = require("util");
const algorithm = 'aes-256-gcm';
const scryptAsync = (0, util_1.promisify)(crypto_1.scrypt);
const useEncryption = (config) => {
    let key = null;
    const salt = config.salt || (0, crypto_1.randomBytes)(16).toString('hex');
    const generateKey = async () => {
        if (!key) {
            key = (await scryptAsync(config.password, salt, 32));
        }
        return key;
    };
    return {
        async encrypt(data) {
            const key = await generateKey();
            const iv = (0, crypto_1.randomBytes)(16);
            const cipher = (0, crypto_1.createCipheriv)(algorithm, key, iv);
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
        async decrypt(encryptedData) {
            const key = await generateKey();
            const decipher = (0, crypto_1.createDecipheriv)(algorithm, key, Buffer.from(encryptedData.iv, 'hex'));
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(encryptedData.encrypted, 'hex')),
                decipher.final()
            ]);
            return JSON.parse(decrypted.toString('utf8'));
        }
    };
};
exports.useEncryption = useEncryption;
