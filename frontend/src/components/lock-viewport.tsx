"use client";

import { useEffect } from "react";

/** iOS Safari ignores user-scalable=no; block pinch-zoom gestures instead. */
export function LockViewport() {
  useEffect(() => {
    const block = (event: Event) => event.preventDefault();
    document.addEventListener("gesturestart", block, { passive: false });
    document.addEventListener("gesturechange", block, { passive: false });
    document.addEventListener("gestureend", block, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", block);
      document.removeEventListener("gesturechange", block);
      document.removeEventListener("gestureend", block);
    };
  }, []);
  return null;
}
