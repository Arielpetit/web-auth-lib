import { KeyDerivationService } from "../lib/keyDerivationService";

describe("KeyDerivationService", () => {
  let keyDerivationService: KeyDerivationService;

  beforeEach(() => {
    keyDerivationService = new KeyDerivationService();
  });

  test("should derive a valid key from PRF output and salt", async () => {
    const prfOutput = new Uint8Array(32).fill(1);
    const salt = new Uint8Array(16).fill(2);

    const derivedKey = await keyDerivationService.deriveKey(prfOutput, salt);

    expect(derivedKey).toBeDefined();
    expect(derivedKey).toHaveProperty("algorithm", {
      name: "AES-GCM",
      length: 256,
    });
  });
});
