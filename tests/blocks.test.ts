import { describe, expect, it } from 'vitest';
import type { StoryBlock } from '../src/core/StoryBlock';

/**
 * Every chapter module must expose createBlock() whose id matches its
 * filename — the Director chain and lazy chunking rely on this contract.
 */
const chapterModules: Record<string, () => Promise<{ createBlock(): StoryBlock }>> = {
  'block00-letter': () => import('../src/blocks/block00-letter'),
  'block01-who-is-alice': () => import('../src/blocks/block01-who-is-alice'),
  'block02-journey-storm': () => import('../src/blocks/block02-journey-storm'),
  'block03-three-paths': () => import('../src/blocks/block03-three-paths'),
  'block04-connecting-dots': () => import('../src/blocks/block04-connecting-dots'),
  'block05-finale': () => import('../src/blocks/block05-finale'),
};

describe('story block contract', () => {
  it('every chapter exports createBlock() with the lifecycle and a matching id', async () => {
    const ids = new Set<string>();
    for (const [name, load] of Object.entries(chapterModules)) {
      const block = (await load()).createBlock();
      expect(block.id, name).toBe(name);
      expect(typeof block.preload).toBe('function');
      expect(typeof block.enter).toBe('function');
      expect(typeof block.update).toBe('function');
      expect(typeof block.exit).toBe('function');
      expect(typeof block.dispose).toBe('function');
      ids.add(block.id);
    }
    expect(ids.size).toBe(Object.keys(chapterModules).length);
  });

  it('every chapter supports the advance-handler wiring used by main.ts', async () => {
    for (const load of Object.values(chapterModules)) {
      const block = (await load()).createBlock() as StoryBlock & {
        setAdvanceHandler?: (fn: () => void) => void;
      };
      expect(typeof block.setAdvanceHandler).toBe('function');
    }
  });
});

describe('content data', () => {
  it('block02 milestones carry date slots for Alice to fill', async () => {
    const { block02Content } = await import('../src/content/block02');
    expect(block02Content.milestones).toHaveLength(3);
    for (const m of block02Content.milestones) {
      expect(m.date.length).toBeGreaterThan(0);
      expect(m.label.length).toBeGreaterThan(0);
    }
  });

  it('block05 hobbies are colored clickable words with notes', async () => {
    const { block05Content } = await import('../src/content/block05');
    expect(block05Content.hobbies.length).toBeGreaterThanOrEqual(3);
    for (const h of block05Content.hobbies) {
      expect(h.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(h.note.length).toBeGreaterThan(0);
    }
    expect(block05Content.goodbyes).toContain('再见');
  });
});
