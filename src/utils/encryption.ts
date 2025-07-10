import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Credentials } from '../types';

// Ключ шифрования
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Пример: 'your-32-byte-key-in-hex'

function encrypt(data: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decrypt(encryptedData: string): string {
  const buffer = Buffer.from(encryptedData, 'base64');
  
  const iv = buffer.subarray(0, 12);
  const authTag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  
  const decipher = createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  
  return decrypted.toString('utf8');
}

export function encryptTokens(tokens: Credentials): string {
  return encrypt(JSON.stringify(tokens));
}

export function decryptTokens(encryptedTokens: string): Credentials {
  return JSON.parse(decrypt(encryptedTokens)) as Credentials;
}