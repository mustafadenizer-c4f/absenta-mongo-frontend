import { useState, useEffect, useCallback } from 'react';

/**
 * Like useState<string | null> but auto-clears the value after `ms` milliseconds.
 * Usage: const [error, setError] = useAutoClearing(7000);
 */
export function useAutoClearing(ms = 7000): [string | null, (v: string | null) => void] {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    if (value === null) return;
    const timer = setTimeout(() => setValue(null), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  const set = useCallback((v: string | null) => setValue(v), []);
  return [value, set];
}
