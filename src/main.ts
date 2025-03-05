import "style.css";
import logo from "./icon.jpg";
import { main } from "./lib/lib";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="container mx-auto px-4 py-8 flex flex-col items-center gap-8">
    <div class="content-box">
      <a href="/" target="_blank">
        <img src="${logo}" class="logo" alt="logo" />
      </a>
      <h1 class="text-center">WebAuthn PRF</h1>
      <div class="flex justify-center gap-6">
        <button id="registerBtn" type="button" class="btn btn-primary btn-soft">Register</button>
        <button id="authenticateBtn" type="button" class="btn btn-primary btn-soft">Authenticate</button>
        <button id="logoutBtn" type="button" class="btn btn-primary btn-soft">Logout</button>
      </div>
      <div class="w-full overflow-scroll" id="error"></div>

      <!-- Message input and save button -->
      <input id="messageInput" type="text" placeholder="Enter a message" class="input" />
      <button id="saveMessageBtn" class="btn btn-primary">Save Message</button>

      <!-- Display saved messages -->
      <ul id="messageList" class="w-full overflow-scroll"></ul>
      <!-- Display un-encryptes messages -->
      <ul id="messageList" class="w-full overflow-scroll"></ul>
    </div>
  </div>
`;

main().catch(console.error);
