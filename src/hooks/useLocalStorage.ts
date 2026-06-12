import { useState, useEffect } from 'react';

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
  const readValue = (): T => {
    const storage = getStorage();
    if (!storage) {
      return initialValue;
    }

    try {
      const item = storage.getItem(key);
      const parsed = item ? JSON.parse(item) : initialValue;
      return normalize ? normalize(parsed) : parsed;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      try {
        storage.removeItem(key);
      } catch {
        // Ignore storage cleanup failures so startup can continue.
      }
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(() => {
    return readValue();
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      const normalizedValue = normalize ? normalize(valueToStore) : valueToStore;
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
          setStoredValue(normalize ? normalize(parsed) : parsed);
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, normalize]);

  return [storedValue, setValue] as const;
}