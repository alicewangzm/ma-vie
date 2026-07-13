import { describe, expect, it } from 'vitest';
import type { StoryBlock } from '../src/core/StoryBlock';

/**
 * Every chapter module must expose createBlock() whose id matches its
 * filename — the Director chain and lazy chunking rely on this contract.
 */
const chapterModules: Record<string, () => Promise<{ createBlock(): StoryBlock }>> = {
  'block00-letter': () => import('../src/blocks/block00-letter'),
  'block01-who-is-alice': () => import('../src/blocks/block01-who-is-alice'),
  'block02-university': () => import('../src/blocks/block02-university'),
  'block03-storm': () => import('../src/blocks/block03-storm'),
  'block04-alethea': () => import('../src/blocks/block04-alethea'),
  'block05-teaching': () => import('../src/blocks/block05-teaching'),
  'block06-three-paths': () => import('../src/blocks/block06-three-paths'),
  'block07-connecting-dots': () => import('../src/blocks/block07-connecting-dots'),
  'block08-finale': () => import('../src/blocks/block08-finale'),
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
  it('storm chapter carries its date slot and full milestone/self-talk copy', async () => {
    const { stormContent } = await import('../src/content/block03');
    expect(stormContent.date.length).toBeGreaterThan(0);
    // written test (the starting point) + interviews one to three
    expect(stormContent.milestones).toHaveLength(4);
    expect(stormContent.sideLog.length).toBeGreaterThanOrEqual(4);
  });

  it('university beats reference only known visual cues', async () => {
    const { universityContent } = await import('../src/content/block02');
    const known = new Set(['waterloo', 'laurier', 'projects', 'coop', 'awards']);
    for (const beat of universityContent.beats) {
      if (beat.cue) expect(known.has(beat.cue), beat.cue).toBe(true);
    }
  });

  it('finale hobbies are colored clickable words and goodbyes span languages', async () => {
    const { finaleContent } = await import('../src/content/block08');
    expect(finaleContent.hobbies.length).toBeGreaterThanOrEqual(3);
    for (const h of finaleContent.hobbies) {
      expect(h.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(h.word.length).toBeGreaterThan(0);
    }
    expect(finaleContent.goodbyes).toContain('再见');
    expect(finaleContent.email).toMatch(/@gmail\.com$/);
  });
});
