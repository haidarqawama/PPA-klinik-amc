const API_PORT = process.env.NEXT_PUBLIC_API_PORT || "8080";

const CAPACITOR_API_URL = "http://192.168.0.101:8080";

export function getApiBaseUrl(): string {
  // Capacitor/APK mode: use hardcoded server IP
  if (typeof window !== "undefined" && "Capacitor" in window) {
    return CAPACITOR_API_URL;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
