import { useState, useEffect, useRef } from 'react';

const getStorage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  normalize?: (value: unknown) => T,
) {
  const initialValueRef = useRef(initialValue);
  const normalizeRef = useRef(normalize);
  const writeVersionRef = useRef(0);

  normalizeRef.current = normalize;

  const readValue = (): T => {
    const storage = getStorage();
    if (!storage) {
      return initialValueRef.current;
    }

    try {
      const item = storage.getItem(key);
      const parsed = item ? JSON.parse(item) : initialValueRef.current;
      return normalizeRef.current ? normalizeRef.current(parsed) : parsed;
    } catch {
      try {
        storage.removeItem(key);
      } catch {
        // Ignore storage cleanup failures so startup can continue.
      }
      return initialValueRef.current;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(() => initialValueRef.current);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;
    const writeVersionAtStart = writeVersionRef.current;

    const hydrate = () => {
      if (cancelled || writeVersionRef.current !== writeVersionAtStart) return;
      setStoredValue(readValue());
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(hydrate, { timeout: 700 });
    } else {
      timeoutId = window.setTimeout(hydrate, 0);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  // Hydrate once per storage key after the browser has had a chance to paint.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      const normalizedValue = normalizeRef.current ? normalizeRef.current(valueToStore) : valueToStore;
      writeVersionRef.current += 1;
      setStoredValue(normalizedValue);
      getStorage()?.setItem(key, JSON.stringify(normalizedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          setStoredValue(normalizeRef.current ? normalizeRef.current(parsed) : parsed);
        } catch {
          setStoredValue(initialValueRef.current);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue] as const;
}