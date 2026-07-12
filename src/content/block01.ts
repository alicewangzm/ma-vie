/** Block 01 "Who Is Alice" (intro island) — copy from STORY-SCRIPT.md. */
export const islandContent = {
  lines: [
    "You're a small cat with a big task.",
    'Wander wherever you like — the sky is yours to roam.',
    'Somewhere in it is Alice,',
    'making her way through the mist —',
    'and making every second count.',
    'Go find her. Follow the glow.',
  ],
  /** Tutorial prompts, shown in order as the traveler completes each one. */
  tutorial: [
    'left circle (or WASD) — walk',
    'right circle (or drag) — look around',
    'now — chase the two lights ✦',
  ],
  continueHint: 'follow the gold light',
} as const;
