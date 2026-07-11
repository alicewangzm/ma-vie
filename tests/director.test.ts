import { describe, it, expect } from 'vitest';
import { Director, type Transition } from '../src/core/Director';
import type { StoryBlock } from '../src/core/StoryBlock';
import type { WorldContext } from '../src/core/WorldContext';
import { createProgressStore } from '../src/core/progress';

/** Fake block that records every lifecycle call into a shared log. */
function fakeBlock(id: string, log: string[]): StoryBlock {
  return {
    id,
    preload: async () => {
      log.push(`preload:${id}`);
    },
    enter: () => {
      log.push(`enter:${id}`);
    },
    update: () => {
      log.push(`update:${id}`);
    },
    exit: async () => {
      log.push(`exit:${id}`);
    },
    dispose: () => {
      log.push(`dispose:${id}`);
    },
  };
}

function fakeTransition(log: string[]): Transition {
  return {
    close: async () => {
      log.push('wipe:close');
    },
    open: async () => {
      log.push('wipe:open');
    },
  };
}

function fakeCtx(): WorldContext {
  // Director only touches ctx.progress; blocks receive the rest.
  return { progress: createProgressStore() } as unknown as WorldContext;
}

function setup(ids: string[]) {
  const log: string[] = [];
  const ctx = fakeCtx();
  const director = new Director(ctx, fakeTransition(log));
  for (const id of ids) {
    director.register({ id, load: async () => fakeBlock(id, log) });
  }
  return { log, ctx, director };
}

describe('Director', () => {
  it('start() preloads, enters the first block, then opens the wipe', async () => {
    const { log, director } = setup(['a', 'b']);
    await director.start();
    expect(log).toEqual(['preload:a', 'enter:a', 'wipe:open']);
    expect(director.currentId).toBe('a');
  });

  it('next() runs close → exit → dispose → enter → open in order', async () => {
    const { log, director } = setup(['a', 'b']);
    await director.start();
    log.length = 0;

    const advanced = await director.next();
    expect(advanced).toBe(true);
    // preload of b overlaps the wipe close; both must precede teardown of a
    expect(log.indexOf('preload:b')).toBeLessThan(log.indexOf('exit:a'));
    expect(log.indexOf('wipe:close')).toBeLessThan(log.indexOf('exit:a'));
    expect(log.slice(log.indexOf('exit:a'))).toEqual([
      'exit:a',
      'dispose:a',
      'enter:b',
      'wipe:open',
    ]);
    expect(director.currentId).toBe('b');
  });

  it('next() at the end of the chain is a no-op', async () => {
    const { director } = setup(['a']);
    await director.start();
    expect(await director.next()).toBe(false);
    expect(director.currentId).toBe('a');
  });

  it('ignores re-entrant next() while a transition is in flight', async () => {
    const { log, director } = setup(['a', 'b', 'c']);
    await director.start();
    log.length = 0;

    const [first, second] = await Promise.all([director.next(), director.next()]);
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(director.currentId).toBe('b');
    expect(log.filter((e) => e === 'enter:b')).toHaveLength(1);
    expect(log).not.toContain('enter:c');
  });

  it('only ticks the current block, never a disposed one', async () => {
    const { log, director } = setup(['a', 'b']);
    await director.start();
    director.update(0.016, 1);
    await director.next();
    director.update(0.016, 2);
    const updates = log.filter((e) => e.startsWith('update:'));
    expect(updates).toEqual(['update:a', 'update:b']);
  });

  it('records visits in the progress store as blocks begin', async () => {
    const { ctx, director } = setup(['a', 'b']);
    await director.start();
    expect(ctx.progress.get().currentBlock).toBe('a');
    await director.next();
    const s = ctx.progress.get();
    expect(s.currentBlock).toBe('b');
    expect(s.visited).toEqual(['a', 'b']);
    expect(s.completion).toBe(1);
  });
});
