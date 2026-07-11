import { describe, it, expect, vi } from 'vitest';
import { createProgressStore } from '../src/core/progress';

describe('progress store', () => {
  it('starts empty', () => {
    const store = createProgressStore();
    expect(store.get()).toEqual({
      currentBlock: null,
      visited: [],
      totalBlocks: 0,
      completion: 0,
    });
  });

  it('tracks visits and completion fraction', () => {
    const store = createProgressStore();
    store.setTotalBlocks(4);
    store.beginBlock('a');
    store.beginBlock('b');
    expect(store.get().visited).toEqual(['a', 'b']);
    expect(store.get().completion).toBe(0.5);
    expect(store.get().currentBlock).toBe('b');
  });

  it('does not double-count revisited blocks', () => {
    const store = createProgressStore();
    store.setTotalBlocks(2);
    store.beginBlock('a');
    store.beginBlock('a');
    expect(store.get().visited).toEqual(['a']);
    expect(store.get().completion).toBe(0.5);
  });

  it('notifies subscribers and supports unsubscribe', () => {
    const store = createProgressStore();
    const fn = vi.fn();
    const off = store.subscribe(fn);
    store.setTotalBlocks(1);
    store.beginBlock('a');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(
      expect.objectContaining({ currentBlock: 'a', completion: 1 }),
    );
    off();
    store.beginBlock('b');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('completion is 0 when total is unset (no divide-by-zero)', () => {
    const store = createProgressStore();
    store.beginBlock('a');
    expect(store.get().completion).toBe(0);
  });
});
