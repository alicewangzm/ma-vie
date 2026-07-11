/**
 * Tiny observable store tracking journey progress.
 * `completion` (0..1) drives the color-dot portrait in the finale.
 */
export interface ProgressState {
  currentBlock: string | null;
  visited: readonly string[];
  totalBlocks: number;
  completion: number;
}

export type ProgressListener = (state: ProgressState) => void;

export interface ProgressStore {
  get(): ProgressState;
  subscribe(fn: ProgressListener): () => void;
  setTotalBlocks(n: number): void;
  beginBlock(id: string): void;
}

export function createProgressStore(): ProgressStore {
  let state: ProgressState = {
    currentBlock: null,
    visited: [],
    totalBlocks: 0,
    completion: 0,
  };
  const listeners = new Set<ProgressListener>();

  function set(patch: Partial<ProgressState>): void {
    state = { ...state, ...patch };
    state = {
      ...state,
      completion: state.totalBlocks > 0 ? state.visited.length / state.totalBlocks : 0,
    };
    listeners.forEach((fn) => fn(state));
  }

  return {
    get: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    setTotalBlocks(n) {
      set({ totalBlocks: n });
    },
    beginBlock(id) {
      const visited = state.visited.includes(id) ? state.visited : [...state.visited, id];
      set({ currentBlock: id, visited });
    },
  };
}
