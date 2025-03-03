export interface EncryptionKey {
  key: CryptoKey;
}
export class KeyDerivationService {
  async deriveKey(prfOutput: Uint8Array, salt: Uint8Array): Promise<CryptoKey> {
    try {
      // Import the raw PRF output as a base key for HKDF.
      const baseKey = await crypto.subtle.importKey(
        "raw",
        prfOutput,
        { name: "HKDF" },
        false,
        ["deriveKey"],
      );

      // Derive a 256-bit AES-GCM key using HKDF.
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: "HKDF",
          hash: "SHA-256",
          salt: salt,
          info: new Uint8Array([1, 2, 3, 4]),
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      );

      return derivedKey;
    } catch (error) {
      throw new Error(`Key derivation error: ${(error as Error).message}`);
    }
  }
}
