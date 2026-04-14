const protocol = window.location.protocol === "https:" ? "https" : "http";
const host = window.location.hostname;
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

const configuredPointsToLocalhost =
  configuredBaseUrl?.includes("localhost") ||
  configuredBaseUrl?.includes("127.0.0.1");

const viewingFromLocalhost = host === "localhost" || host === "127.0.0.1";

const shouldUseHostFallback =
  !configuredBaseUrl || (configuredPointsToLocalhost && !viewingFromLocalhost);

export const API_BASE_URL =
  shouldUseHostFallback ? `${protocol}://${host}:8000` : configuredBaseUrl;
