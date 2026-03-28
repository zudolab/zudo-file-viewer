import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initBackend } from "@/backend";
import { createMockAdapter } from "@/backend/mock-adapter";
import App from "@/app";
import "@/tailwind.css";

initBackend(createMockAdapter());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
