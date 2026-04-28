// In dev, leave VITE_API_BASE_URL unset so requests go through the Vite proxy
// (vite.config.ts → server.proxy) — this avoids mixed-content errors when the
// dev server runs HTTPS. In prod (Cloud Run), the build is run with
// VITE_API_BASE_URL set to the backend's https URL.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
