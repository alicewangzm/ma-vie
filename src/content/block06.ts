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
  /** Cloud modals behind the ? buttons on the envisioned roads. */
  modals: {
    pilot: {
      title: 'The sky, from the other side of the glass',
      body: [
        '[placeholder] Medical exam — passed. Ground school — next.',
        '[placeholder] The vision: a small plane, her parents in the back, the map going gold beneath the wings.',
      ],
      images: [{ src: 'assets/pilot-vision.jpg', alt: 'flying with her parents — envisioned' }],
    },
    pawhearth: {
      title: 'PawHearth — a company for small, warm creatures',
      body: [
        '[placeholder] What PawHearth is, in one warm sentence.',
        '[placeholder] Where it stands today, and what comes next.',
        'Try the home-screen prototype — tap the cat:',
      ],
      /** The real liquid-glass prototype, live in the cloud. */
      embed: {
        src: 'assets/pawHearthHome.html',
        width: 500,
        height: 1020,
        label: 'PawHearth home-screen prototype (interactive)',
      },
    },
  },
} as const;
