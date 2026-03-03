import { useEffect } from 'react';

export function useDebouncedAutosave(value: string, onSave: (v: string) => void, delay = 5000) {
  useEffect(() => {
    if (!value) return;
    const timer = setTimeout(() => onSave(value), delay);
    return () => clearTimeout(timer);
  }, [value, onSave, delay]);
}
