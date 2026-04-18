// All API requests use a relative base URL so they go through the Vite dev
// server proxy (vite.config.ts → server.proxy). The proxy forwards /api/*
// to the backend over plain HTTP internally, which avoids mixed-content
// errors when the frontend is served over HTTPS.
export const API_BASE_URL = "";
