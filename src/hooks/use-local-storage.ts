
'use client';

import { useState, useEffect } from 'react';

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
  const [isMounted, setIsMounted] = useState(false);
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        const item = window.localStorage.getItem(key);
        const parsedItem = tryParse<T>(item);
        if (parsedItem !== null) {
          setStoredValue(parsedItem);
        } else {
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.log(error);
        setStoredValue(initialValue);
      }
    }
  }, [isMounted, key, initialValue]);


  const setValue = (value: T | ((val: T) => T)) => {
    if (!isMounted) return;
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

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

  return [storedValue, setValue] as const;
}
