import { WebAuthnService } from "../webAuthnService";

describe("WebAuthnService", () => {
  let webAuthnService: WebAuthnService;

  // Mock the global window and navigator for testing
  beforeEach(() => {
    global.window = global as any;
    webAuthnService = new WebAuthnService();

    Object.defineProperty(global.navigator, "credentials", {
      value: {
        create: jest.fn(),
        get: jest.fn(),
      },
      writable: true,
    });

    // Mock localStorage
    Object.defineProperty(global, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  test("should register a new credential", async () => {
    const mockCredential = { rawId: new ArrayBuffer(16) };
    (navigator.credentials.create as jest.Mock).mockResolvedValue(
      mockCredential,
    );

    const registrationOptions: PublicKeyCredentialCreationOptions = {
      challenge: new ArrayBuffer(32),
      rp: { name: "localhost", id: "localhost" },
      user: {
        id: new ArrayBuffer(16),
        name: "test",
        displayName: "Test User",
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    };

    const registration = await webAuthnService.register(registrationOptions);

    expect(registration).toHaveProperty("credentialId");
    expect(registration).toHaveProperty("rawCredential");
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  test("should fail registration if no credential returned", async () => {
    (navigator.credentials.create as jest.Mock).mockResolvedValue(null);

    const registrationOptions: PublicKeyCredentialCreationOptions = {
      challenge: new ArrayBuffer(32),
      rp: { name: "localhost", id: "localhost" },
      user: {
        id: new ArrayBuffer(16),
        name: "test",
        displayName: "Test User",
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    };

    await expect(webAuthnService.register(registrationOptions)).rejects.toThrow(
      "Registration failed: No credential returned.",
    );
  });

  test("should authenticate a user", async () => {
    const mockAssertion = {
      getClientExtensionResults: jest.fn(() => ({
        prf: { results: { first: new ArrayBuffer(32) } },
      })),
    };

    (navigator.credentials.get as jest.Mock).mockResolvedValue(mockAssertion);
    (localStorage.getItem as jest.Mock).mockReturnValue("mockedBase64Salt");

    const authenticationOptions: PublicKeyCredentialRequestOptions = {
      challenge: new ArrayBuffer(32),
      allowCredentials: [
        {
          id: new ArrayBuffer(16),
          type: "public-key",
        },
      ],
      timeout: 60000,
    };

    const authentication = await webAuthnService.authenticate(
      authenticationOptions,
    );

    expect(authentication).toHaveProperty("assertion");
    expect(authentication).toHaveProperty("prfResult");
    expect(localStorage.getItem).toHaveBeenCalledWith("registrationSalt");
  });

  test("should fail authentication if no assertion returned", async () => {
    (navigator.credentials.get as jest.Mock).mockResolvedValue(null);
    (localStorage.getItem as jest.Mock).mockReturnValue("mockedBase64Salt");

    const authenticationOptions: PublicKeyCredentialRequestOptions = {
      challenge: new ArrayBuffer(32),
      allowCredentials: [
        {
          id: new ArrayBuffer(16),
          type: "public-key",
        },
      ],
      timeout: 60000,
    };

    await expect(
      webAuthnService.authenticate(authenticationOptions),
    ).rejects.toThrow("Authentication failed: No assertion returned.");
  });

  test("should fail authentication if no stored salt is found", async () => {
    (navigator.credentials.get as jest.Mock).mockResolvedValue({});
    (localStorage.getItem as jest.Mock).mockReturnValue(null);

    const authenticationOptions: PublicKeyCredentialRequestOptions = {
      challenge: new ArrayBuffer(32),
      allowCredentials: [
        {
          id: new ArrayBuffer(16),
          type: "public-key",
        },
      ],
      timeout: 60000,
    };

    await expect(
      webAuthnService.authenticate(authenticationOptions),
    ).rejects.toThrow("No stored salt found for authentication.");
  });

  test("should fail authentication if PRF result is missing", async () => {
    const mockAssertion = {
      getClientExtensionResults: jest.fn(() => ({})),
    };

    (navigator.credentials.get as jest.Mock).mockResolvedValue(mockAssertion);
    (localStorage.getItem as jest.Mock).mockReturnValue("mockedBase64Salt");

    const authenticationOptions: PublicKeyCredentialRequestOptions = {
      challenge: new ArrayBuffer(32),
      allowCredentials: [
        {
          id: new ArrayBuffer(16),
          type: "public-key",
        },
      ],
      timeout: 60000,
    };

    await expect(
      webAuthnService.authenticate(authenticationOptions),
    ).rejects.toThrow("PRF result missing in the assertion.");
  });
});
