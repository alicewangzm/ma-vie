import type { WorldContext } from './WorldContext';

/**
 * A self-contained chapter of the experience. The Director owns a chain of
 * these; adding a chapter to the site means adding one module that exports
 * a StoryBlock and registering it — nothing else changes.
 */
export interface StoryBlock {
  id: string;
  /** Lazy-load heavy assets (textures, GLTFs). Runs while clouds close in. */
  preload(): Promise<void>;
  /** Build scene contents. Called after the previous block is disposed. */
  enter(ctx: WorldContext): void;
  /** Per-frame tick. dt = seconds since last frame, t = seconds since boot. */
  update(dt: number, t: number): void;
  /** Transition out (resolve when outro animation is done). */
  exit(): Promise<void>;
  /** Free every GPU resource this block created. Profiled — no leaks. */
  dispose(): void;
}

/** Registration handle: the module itself is only imported when needed. */
export interface BlockRegistration {
  id: string;
  load: () => Promise<StoryBlock>;
}
