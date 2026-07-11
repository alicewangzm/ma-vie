import type { StoryBlock } from '../core/StoryBlock';
import type { WorldContext } from '../core/WorldContext';
import { typewriterLines, type TypewriterHandle } from '../ui/overlay';

/**
 * Block 01 — "Who is Alice" (Stage 2 will build the real intro island).
 * Stage 1 stub: proves the Director's lazy-load → wipe → enter chain works
 * end to end. The cat idles on the hill; a placeholder title fades in.
 */
class Block01WhoIsAlice implements StoryBlock {
  readonly id = 'block01-who-is-alice';

  private ctx!: WorldContext;
  private typewriter: TypewriterHandle | null = null;

  async preload(): Promise<void> {
    // Stage 2: island geometry, tutorial hint sprites.
  }

  enter(ctx: WorldContext): void {
    this.ctx = ctx;
    ctx.cat.object3D.position.set(0, 1.1, -6); // on the hill crest
    ctx.cat.object3D.visible = true;
    ctx.rig.follow(ctx.cat.object3D);
    this.typewriter = typewriterLines(ctx.overlay, [
      '[placeholder] Chapter One — Who is Alice',
      '[placeholder] (this island is built in Stage 2)',
    ]);
  }

  update(dt: number): void {
    this.ctx.cat.update(dt);
  }

  async exit(): Promise<void> {}

  dispose(): void {
    this.typewriter?.destroy();
    this.ctx.rig.follow(null);
    // cat is shared world state (WorldContext), not ours to dispose
  }
}

export function createBlock(): Block01WhoIsAlice {
  return new Block01WhoIsAlice();
}
