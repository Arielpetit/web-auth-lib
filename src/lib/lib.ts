import { WebAuthnService } from "./webAuthnService";
import { KeyDerivationService } from "./keyDerivationService";
import { LocalDBService } from "./localDBService";

const domainNameId = window.location.hostname;

// Convert ArrayBuffer to Base64 and vice versa.
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return window.btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Load messages from localStorage and display them
function loadMessages(decryptedMessages: string[] = []) {
  const messageList = document.querySelector("#messageList")!;
  messageList.innerHTML = decryptedMessages
    .map((msg: string) => `<li>${msg}</li>`)
    .join("");
}

// Save a message to localStorage
export async function saveMessage() {
  const input = document.querySelector<HTMLInputElement>("#messageInput")!;
  const message = input.value.trim();
  if (message) {
    const messages = JSON.parse(localStorage.getItem("messages") || "[]");
    const keyService = new KeyDerivationService();
    const storedSaltBase64 = localStorage.getItem("registrationSalt");
    const storedSalt = storedSaltBase64
      ? base64ToUint8Array(storedSaltBase64)
      : new Uint8Array();

    const encryptionKey = {
      key: await keyService.deriveKey(
        new Uint8Array(32),
        new Uint8Array(storedSalt),
      ),
    };

    const localDB = new LocalDBService();
    const encryptedMessage = await localDB.encryptData(message, encryptionKey);

    messages.push(arrayBufferToBase64(encryptedMessage));
    localStorage.setItem("messages", JSON.stringify(messages));
    input.value = "";
    loadMessages();
  }
}

// Register function
export async function handleRegister(): Promise<void> {
  const webAuthnService = new WebAuthnService();

  const regOptions: PublicKeyCredentialCreationOptions = {
    challenge: crypto.getRandomValues(new Uint8Array(32)).buffer,
    rp: { name: "Localhost, Inc", id: domainNameId },
    user: {
      id: crypto.getRandomValues(new Uint8Array(16)),
      name: "",
      displayName: "",
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 }, // ES256
      { type: "public-key", alg: -257 }, // RS256
    ],
    timeout: 60000,
    authenticatorSelection: {
      authenticatorAttachment: "platform", 
      userVerification: "required", 
    },
    attestation: "none",
    extensions: {
      prf: { eval: { first: new Uint8Array(32).fill(1) } },
    },
  };

  try {
    const registration = await webAuthnService.register(regOptions);

    // Convert credentialId to Base64 and store in local storage.
    const credentialIdBase64 = arrayBufferToBase64(registration.credentialId);
    localStorage.setItem("credentialId", credentialIdBase64);
  } catch (error) {
    console.error("Error in process:", (error as Error).message);
    document.getElementById("error")!.textContent = (error as Error).message;
  }
}

// Authenticate function
export async function handleAuthenticate(): Promise<string[]> {
  const webAuthnService = new WebAuthnService();
  const keyService = new KeyDerivationService();
  const localDB = new LocalDBService();

  // Retrieve the credentialId from local storage.
  const storedCredentialIdBase64 = localStorage.getItem("credentialId");
  if (!storedCredentialIdBase64) {
    console.error("No stored credentialId found.");
    document.getElementById("error")!.textContent =
      "No stored credentialId found.";
    return [];
  }
  const storedCredentialId: ArrayBuffer = base64ToUint8Array(
    storedCredentialIdBase64,
  );

  // Retrieve the salt from local storage.
  const storedSaltBase64 = localStorage.getItem("registrationSalt");
  if (!storedSaltBase64) {
    console.error("No stored salt found.");
    document.getElementById("error")!.textContent = "No stored salt found.";
    return [];
  }
  const storedSalt: ArrayBuffer = base64ToUint8Array(storedSaltBase64);

  const authOptions: PublicKeyCredentialRequestOptions = {
    challenge: crypto.getRandomValues(new Uint8Array(32)).buffer,
    allowCredentials: [
      {
        type: "public-key",
        id: storedCredentialId,
      },
    ],
    rpId: domainNameId,
    extensions: {
      prf: { eval: { first: new Uint8Array(32).fill(1) } },
    },
  };

  try {
    const assertion = await webAuthnService.authenticate(authOptions);
    console.log("PRF output received:", assertion.prfResult);

    // Derive the encryption key using prfResult and stored salt
    const encryptionKey = {
      key: await keyService.deriveKey(
        new Uint8Array(32),
        new Uint8Array(storedSalt),
      ),
    };

    const messages = JSON.parse(localStorage.getItem("messages") || "[]");

    const decryptedMessages = await Promise.all(
      messages.map(async (msg: string) => {
        const encryptedData = new Uint8Array(base64ToUint8Array(msg));
        try {
          console.log("Attempting to decrypt message:", msg);
          const decryptedMessage = await localDB.decryptData(
            encryptedData.buffer,
            encryptionKey,
          );
          return decryptedMessage;
        } catch (error) {
          console.error("Decryption failed for message:", msg, error);
          return "Decryption failed";
        }
      }),
    );

    const messageList = document.querySelector("#messageList")!;
    messageList.innerHTML = decryptedMessages
      .map((msg: string) => `<li>${msg}</li>`)
      .join("");

    // Pass decrypted messages to loadMessages
    loadMessages(decryptedMessages);

    return decryptedMessages;
  } catch (error) {
    console.error("Error in process:", (error as Error).message);
    document.getElementById("error")!.textContent = (error as Error).message;
    return [];
  }
}

// Logout function
export function handleLogout(): void {
  // localStorage.removeItem("credentialId");
  // localStorage.removeItem("registrationSalt");
  // localStorage.removeItem("messages");
  console.log("User logged out. Credential and messages removed.");
  document.getElementById("error")!.textContent = "Logged out successfully.";
}

// Main function to set up event listeners
export async function main(): Promise<void> {
  document
    .getElementById("registerBtn")
    ?.addEventListener("click", handleRegister);
  document
    .getElementById("authenticateBtn")
    ?.addEventListener("click", handleAuthenticate);
  document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
  document
    .getElementById("saveMessageBtn")
    ?.addEventListener("click", saveMessage);
}
