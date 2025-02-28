import { WebAuthnService } from '../webAuthnService';

describe('WebAuthnService', () => {
  let webAuthnService: WebAuthnService;

  // Mock the global window and navigator for testing
  beforeEach(() => {
    global.window = global as any;
    webAuthnService = new WebAuthnService();
  
    Object.defineProperty(global.navigator, 'credentials', {
      value: {
        create: jest.fn(),
        get: jest.fn(),
      },
      writable: true,
    });
  
    // Ensure salt is set properly for authentication
    webAuthnService.salt = new ArrayBuffer(16);
  });

  test('should register a new credential', async () => {
    const mockCredential = { rawId: new ArrayBuffer(16) };
    (navigator.credentials.create as jest.Mock).mockResolvedValue({ rawId: mockCredential.rawId });

    const registrationOptions: PublicKeyCredentialCreationOptions = {
      challenge: new ArrayBuffer(32),
      rp: { name: 'localhost', id: 'localhost' },
      user: {
        id: new ArrayBuffer(16),
        name: 'test',
        displayName: 'Test User',
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    };

    const registration = await webAuthnService.register(registrationOptions);

    expect(registration).toHaveProperty('credentialId');
    expect(registration).toHaveProperty('rawCredential');
  });

  test('should fail registration if no credential returned', async () => {
    (navigator.credentials.create as jest.Mock).mockResolvedValue(null);

    const registrationOptions: PublicKeyCredentialCreationOptions = {
      challenge: new ArrayBuffer(32),
      rp: { name: 'localhost', id: 'localhost' },
      user: {
        id: new ArrayBuffer(16),
        name: 'test',
        displayName: 'Test User',
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    };

    await expect(webAuthnService.register(registrationOptions)).rejects.toThrow('Registration failed: No credential returned.');
  });

  // Authentication Tests

  test('should fail authentication if no credential returned', async () => {
    (navigator.credentials.get as jest.Mock).mockResolvedValue(null);
  
    const assertionOptions: PublicKeyCredentialRequestOptions = {
      challenge: new ArrayBuffer(32),
      rpId: 'localhost',
      allowCredentials: [{ id: new ArrayBuffer(16), type: 'public-key' }],
    };
  
    await expect(webAuthnService.authenticate(assertionOptions)).rejects.toThrow(
      'Authentication error: Authentication failed: No assertion returned.'
    );
  });
  
  test('should fail authentication if credential is invalid', async () => {
    (navigator.credentials.get as jest.Mock).mockResolvedValue({ assertion: null });
  
    const assertionOptions: PublicKeyCredentialRequestOptions = {
      challenge: new ArrayBuffer(32),
      rpId: 'localhost',
      allowCredentials: [{ id: new ArrayBuffer(16), type: 'public-key' }],
    };
  
    await expect(webAuthnService.authenticate(assertionOptions)).rejects.toThrow(
      'Authentication error: Authentication failed: No assertion returned.'
    );
  });
});

