import React, { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!key) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading initial value from localStorage for key "${key}"`, error);
      return initialValue;
    }
  });

  // This effect runs when the key changes to re-sync the state with the new key's value.
  useEffect(() => {
    if (!key) {
      setStoredValue(initialValue);
      return;
    }
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      console.error(`Error reading localStorage for key "${key}"`, error);
      setStoredValue(initialValue);
    }
    // The consumer of the hook must provide a stable initialValue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // This effect persists the state to localStorage whenever the key or value changes.
  useEffect(() => {
    if (key) {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(`Error writing to localStorage for key "${key}"`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;