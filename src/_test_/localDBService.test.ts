import { LocalDBService } from "../localDBService";
import { KeyDerivationService } from "../lib/keyDerivationService";

describe("LocalDBService", () => {
  let localDBService: LocalDBService;
  let keyDerivationService: KeyDerivationService;

  beforeEach(() => {
    localDBService = new LocalDBService();
    keyDerivationService = new KeyDerivationService();
  });

  test("should encrypt and decrypt a message correctly", async () => {
    const message = "Hello, world!";
    const salt = new Uint8Array(16).fill(3);
    const prfOutput = new Uint8Array(32).fill(1);
    const encryptionKey = {
      key: await keyDerivationService.deriveKey(prfOutput, salt),
    };

    const encryptedMessage = await localDBService.encryptData(
      message,
      encryptionKey,
    );
    const decryptedMessage = await localDBService.decryptData(
      encryptedMessage,
      encryptionKey,
    );

    expect(decryptedMessage).toBe(message);
  });

  test("should throw error if decryption fails", async () => {
    const message = "Hello, world!";
    const salt = new Uint8Array(16).fill(3);
    const prfOutput = new Uint8Array(32).fill(1);
    const encryptionKey = {
      key: await keyDerivationService.deriveKey(prfOutput, salt),
    };

    const encryptedMessage = await localDBService.encryptData(
      message,
      encryptionKey,
    );

    // Convert ArrayBuffer to Uint8Array to modify it
    const encryptedMessageArray = new Uint8Array(encryptedMessage);

    // Altering the encrypted message to test decryption failure
    encryptedMessageArray[0] = 0;

    await expect(
      localDBService.decryptData(encryptedMessageArray.buffer, encryptionKey),
    ).rejects.toThrow("Decryption error");
  });
});
