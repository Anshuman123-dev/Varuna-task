import { useState, useCallback } from 'react';

let globalFallbackDetected = false;
const listeners: Set<(value: boolean) => void> = new Set();

export function notifyFallbackUsed() {
  if (!globalFallbackDetected) {
    globalFallbackDetected = true;
    listeners.forEach(listener => listener(true));
  }
}

export function useFallbackNotification() {
  const [showFallback, setShowFallback] = useState(globalFallbackDetected);

  const subscribe = useCallback((listener: (value: boolean) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  // Subscribe to global fallback notifications
  useState(() => {
    return subscribe(setShowFallback);
  });

  return showFallback;
}
