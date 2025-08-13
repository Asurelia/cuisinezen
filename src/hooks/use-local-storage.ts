
'use client';

import { useState, useEffect, useCallback } from 'react';

function tryParse<T>(value: string | null): T | null {
    if (value === null) return null;
    try {
        return JSON.parse(value, (key, value) => {
            // Check if the value is a string and looks like a date
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
            return value;
        });
    } catch (e) {
        console.error("Failed to parse JSON from localStorage", e);
        return null;
    }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          setStoredValue(tryParse<T>(item) ?? initialValue);
        }
      } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
      }
    }
  }, [isMounted, key, initialValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (!isMounted) {
      return;
    }
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [isMounted, key, storedValue]);
  
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key && e.newValue) {
            const parsedItem = tryParse<T>(e.newValue);
            if (parsedItem !== null) {
                setStoredValue(parsedItem);
            }
        }
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  // Return initialValue on the server and during the first client render
  if (!isMounted) {
    return [initialValue, setValue] as const;
  }

  return [storedValue, setValue] as const;
}
