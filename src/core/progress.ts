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

const STORAGE_KEY = 'wonderland-progress-v1';

function loadSaved(): Pick<ProgressState, 'currentBlock' | 'visited'> {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { currentBlock?: string; visited?: string[] };
      return {
        currentBlock: typeof parsed.currentBlock === 'string' ? parsed.currentBlock : null,
        visited: Array.isArray(parsed.visited)
          ? parsed.visited.filter((v) => typeof v === 'string')
          : [],
      };
    }
  } catch {
    // corrupt or unavailable storage — start fresh
  }
  return { currentBlock: null, visited: [] };
}

export function createProgressStore(): ProgressStore {
  const saved = loadSaved();
  let state: ProgressState = {
    currentBlock: saved.currentBlock,
    visited: saved.visited,
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
    try {
      globalThis.localStorage?.setItem(
        STORAGE_KEY,
        JSON.stringify({ currentBlock: state.currentBlock, visited: state.visited }),
      );
    } catch {
      // private mode / quota — progress just won't survive refresh
    }
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
