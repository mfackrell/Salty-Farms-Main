import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDebouncedAutosave } from './useDebouncedAutosave';

describe('autosave hook', () => {
  it('triggers save after debounce', async () => {
    vi.useFakeTimers();
    const save = vi.fn();
    renderHook(() => useDebouncedAutosave('hello', save, 5000));
    vi.advanceTimersByTime(5000);
    expect(save).toHaveBeenCalledWith('hello');
    vi.useRealTimers();
  });
});
