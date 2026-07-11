/** Block 06 "Three Roads From Here" (Three Paths) — copy from STORY-SCRIPT.md. */
export const pathsContent = {
  title: 'Chapter Five — Three Roads From Here',
  intro: 'From here, the sky splits three ways.',
  /** The gold path — reality, full color, steady. */
  teaching: {
    lines: [
      'The bright road: teaching, full-time, full-color.',
      "This one is real. She's on it now.",
    ],
  },
  /** Faded-blue envisioned path #1 — desaturated, blinking. */
  pilot: {
    lines: [
      'A faded road: the sky, seen from the other side of the glass.',
      'Medical exam — passed. The rest is still a dream.',
      'She pictures it —',
      'flying her parents over the U.S. and Canada,',
      'the whole map going gold beneath the wings.',
    ],
  },
  /** Faded-blue envisioned path #2 — screenshots on floating panels. */
  pawhearth: {
    label: 'PawHearth',
    lines: [
      'Another faded road: PawHearth.',
      'A little company for small, warm creatures.',
      'Still being built — windows into a maybe.',
    ],
    /** Filenames under /assets once Alice drops them in (Stage 3 wiring). */
    screenshots: [] as string[],
  },
  closing: ['Two of these three are wishes.', 'Watch which ones flicker.'],
  continueHint: 'follow the gold light',
} as const;
