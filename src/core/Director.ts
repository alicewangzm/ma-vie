import type { BlockRegistration, StoryBlock } from './StoryBlock';
import type { WorldContext } from './WorldContext';

/** Cloud-wipe (or any) transition the Director runs between blocks. */
export interface Transition {
  /** Cover the screen. Resolves when fully closed. */
  close(): Promise<void>;
  /** Reveal the screen. Resolves when fully open. */
  open(): Promise<void>;
}

const noTransition: Transition = {
  close: () => Promise.resolve(),
  open: () => Promise.resolve(),
};

/**
 * Sequencer that owns the chain of story blocks.
 * Advancing overlaps work: the next block's module load + preload runs
 * concurrently with the cloud wipe closing, so the cut feels instant.
 */
export class Director {
  private registrations: BlockRegistration[] = [];
  private current: StoryBlock | null = null;
  private index = -1;
  private busy = false;

  constructor(
    private ctx: WorldContext,
    private transition: Transition = noTransition,
  ) {}

  register(reg: BlockRegistration): void {
    this.registrations.push(reg);
    this.ctx.progress.setTotalBlocks(this.registrations.length);
  }

  get currentId(): string | null {
    return this.index >= 0 ? this.registrations[this.index].id : null;
  }

  get hasNext(): boolean {
    return this.index + 1 < this.registrations.length;
  }

  get currentIndex(): number {
    return this.index;
  }

  get chapterIds(): string[] {
    return this.registrations.map((r) => r.id);
  }

  /** The live block (for opt-in extras like skipInteraction). */
  get currentBlock(): StoryBlock | null {
    return this.current;
  }

  /** Enter a block directly (no wipe on the way in — we boot behind clouds). */
  async start(atIndex = 0): Promise<void> {
    if (this.index !== -1 || this.registrations.length === 0) return;
    const i = Math.min(Math.max(atIndex, 0), this.registrations.length - 1);
    this.busy = true;
    const reg = this.registrations[i];
    const block = await reg.load();
    await block.preload();
    this.index = i;
    block.enter(this.ctx);
    this.current = block;
    this.ctx.progress.beginBlock(reg.id);
    this.busy = false;
    await this.transition.open();
  }

  /** Advance to the next block with a cloud-wipe. Resolves when open again. */
  next(): Promise<boolean> {
    return this.jumpTo(this.index + 1);
  }

  /** Jump to any chapter (tracker navigation) with a cloud-wipe. */
  async jumpTo(i: number): Promise<boolean> {
    if (this.busy || !this.current || i === this.index) return false;
    if (i < 0 || i >= this.registrations.length) return false;
    this.busy = true;

    const reg = this.registrations[i];
    // load + preload the target block while the clouds close in
    const [nextBlock] = await Promise.all([
      reg.load().then(async (b) => {
        await b.preload();
        return b;
      }),
      this.transition.close(),
    ]);

    const old = this.current;
    this.current = null; // stop ticking the old block before teardown
    await old.exit();
    old.dispose();

    this.index = i;
    nextBlock.enter(this.ctx);
    this.current = nextBlock;
    this.ctx.progress.beginBlock(reg.id);

    await this.transition.open();
    this.busy = false;
    return true;
  }

  update(dt: number, t: number): void {
    this.current?.update(dt, t);
  }
}
