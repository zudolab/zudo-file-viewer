import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initBackend } from "@/backend";
import { createTauriAdapter } from "@/backend/tauri-adapter";
import App from "@/app";
import "@/tailwind.css";

initBackend(createTauriAdapter());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
