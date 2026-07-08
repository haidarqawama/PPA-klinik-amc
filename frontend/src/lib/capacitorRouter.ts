// Check if running inside Capacitor WebView
export function isCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  return "Capacitor" in window;
}
