// Shake-to-record hook using DeviceMotion API.
// Calls onShake() when sustained acceleration crosses the threshold.
import { useEffect, useRef } from "react";

type Opts = {
  enabled?: boolean;
  threshold?: number; // m/s^2 magnitude above gravity
  cooldownMs?: number;
  onShake: () => void;
};

export function useShake({ enabled = true, threshold = 18, cooldownMs = 4000, onShake }: Opts) {
  const lastFired = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (typeof (window as any).DeviceMotionEvent === "undefined") return;

    function handler(e: DeviceMotionEvent) {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      const mag = Math.hypot(a.x, a.y, a.z);
      // Subtract gravity ~9.81
      const delta = Math.abs(mag - 9.81);
      if (delta > threshold) {
        const now = Date.now();
        if (now - lastFired.current > cooldownMs) {
          lastFired.current = now;
          onShake();
        }
      }
    }
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [enabled, threshold, cooldownMs, onShake]);
}

// iOS 13+ requires explicit permission for DeviceMotion.
export async function requestMotionPermission(): Promise<boolean> {
  const M: any = (window as any).DeviceMotionEvent;
  if (M && typeof M.requestPermission === "function") {
    try {
      const r = await M.requestPermission();
      return r === "granted";
    } catch {
      return false;
    }
  }
  return true;
}
