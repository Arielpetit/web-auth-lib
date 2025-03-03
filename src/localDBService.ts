import { EncryptionKey } from "./keyDerivationService";

export interface LocalDB {
  encryptData(plaintext: string, key: EncryptionKey): Promise<ArrayBuffer>;
  decryptData(encrypted: ArrayBuffer, key: EncryptionKey): Promise<string>;
}

export class LocalDBService implements LocalDB {
  async encryptData(
    plaintext: string,
    key: EncryptionKey,
  ): Promise<ArrayBuffer> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      
      // Generate a unique IV for each encryption.
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key.key,
        data,
      );
      // Prepend IV to ciphertext.
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(ciphertext), iv.length);
      return combined.buffer;
    } catch (error) {
      throw new Error(`Encryption error: ${(error as Error).message}`);
    }
  }

  async decryptData(
    encrypted: ArrayBuffer,
    key: EncryptionKey,
  ): Promise<string> {
    try {
      const combined = new Uint8Array(encrypted);
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      const plaintextBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key.key,
        ciphertext,
      );
      const decoder = new TextDecoder();
      return decoder.decode(plaintextBuffer);
    } catch (error) {
      throw new Error(`Decryption error: ${(error as Error).message}`);
    }
  }
}
