//  convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode.apply(null, new Uint8Array(buffer) as any);
  return window.btoa(binary);
}

export interface CredentialRegistration {
  credentialId: ArrayBuffer;
  rawCredential: PublicKeyCredential;
}

export interface CredentialAssertion {
  assertion: PublicKeyCredential;
  prfResult: Uint8Array;
}

export class WebAuthnService {
  //  generate a secure salt.
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  // Triggered by a user gesture (e.g. button click)
  async register(
    options: PublicKeyCredentialCreationOptions,
  ): Promise<CredentialRegistration> {
    try {
      const rawCredential = (await navigator.credentials.create({
        publicKey: options,
      })) as PublicKeyCredential;
      if (!rawCredential || !rawCredential.rawId) {
        throw new Error("Registration failed: No credential returned.");
      }

      // Generate a unique salt for this registration.
      const salt = this.generateSalt();

      // Store salt  in localStorage
      localStorage.setItem(
        "registrationSalt",
        arrayBufferToBase64(salt.buffer),
      );

      return { credentialId: rawCredential.rawId, rawCredential };
    } catch (error) {
      throw new Error(`Registration error: ${(error as Error).message}`);
    }
  }

  async authenticate(
    options: PublicKeyCredentialRequestOptions,
  ): Promise<CredentialAssertion> {
    try {
      const assertion = (await navigator.credentials.get({
        publicKey: options,
      })) as PublicKeyCredential;
      if (!assertion) {
        throw new Error("Authentication failed: No assertion returned.");
      }

      // Retrieve the stored salt from localStorage.
      const storedSaltBase64 = localStorage.getItem("registrationSalt");
      if (!storedSaltBase64) {
        throw new Error("No stored salt found for authentication.");
      }

      // Extract the PRF output from extension results.
      const clientExtResults = (assertion as any).getClientExtensionResults();
      if (!clientExtResults?.prf?.results?.first) {
        throw new Error("PRF result missing in the assertion.");
      }
      const prfResult: Uint8Array = new Uint8Array(
        clientExtResults.prf.results.first,
      );

      // Use the stored salt and PRF result in key derivation.
      return { assertion, prfResult };
    } catch (error) {
      throw new Error(`Authentication error: ${(error as Error).message}`);
    }
  }
}
