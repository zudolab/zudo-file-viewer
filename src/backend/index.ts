import type { BackendAPI } from "./types";

let backend: BackendAPI | null = null;

export function initBackend(api: BackendAPI): void {
  backend = api;
}

export function getBackend(): BackendAPI {
  if (!backend) {
    throw new Error(
      "Backend not initialized. Call initBackend() before getBackend().",
    );
  }
  return backend;
}
