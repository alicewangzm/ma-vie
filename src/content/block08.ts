/**
 * Block 08 "To Be Continued" (Finale) — copy from STORY-SCRIPT.md.
 * POV: Part A is the last third-person beat; from Part B on, Alice speaks
 * as I/my.
 */
export const finaleContent = {
  title: 'Chapter Seven — To Be Continued',
  /** Part A — Google + SF reappear, faded & blinking (third person). */
  partA: [
    'Far off, the lights come back on.',
    'Still faded. Still flickering.',
    'Not real — not yet.',
    'Can she catch it?',
    "We'll see. 🤞",
    '(to be continued)',
  ],
  /** Part B — the reveal (voice flips to first person). */
  reveal: [
    'So — who is Alice?',
    'I am.',
    'Not a traditional UX designer —',
    'but a little bit of a lot of things.',
  ],
  rotatingTitles: ['builder', 'programmer', 'vibe coder', 'teacher', 'future pilot (manifesting)'],
  revealOutro: 'and a little bit of everything.',
  /** Part C — clickable colored words. */
  everythingLead: 'a little bit of a…',
  hobbies: [
    { word: 'musician', color: '#e8734a' },
    { word: 'baker', color: '#d9a441' },
    { word: 'artist', color: '#7a9e6b' },
    { word: 'athlete', color: '#5b8bd9' },
    { word: 'incurable optimist', color: '#9b6bb3' },
  ],
  /** Part D — RGB portrait beats (hobby words become light, become her). */
  rgb: [
    'Three colors make everything on your screen.',
    "Zoom into me, and it's the same —",
    'one channel is me at the piano.',
    'one is me in the kitchen.',
    "one is the part of me that won't stop dreaming.",
    "Apart, they're just light.",
    "Together, they're a whole person.",
  ],
  /** Part E — the reward + wishes. */
  reward: [
    'Remember the reward from the letter?',
    'If walking through this brought a small smile —',
    'that was it. 🥇',
    '(a tiny gold drop of happiness)',
    "And if it didn't — here are my wishes for you instead:",
    'Stay curious.',
    'Stay happy.',
    'When the rain comes — and it will —',
    'move through it as gently as you can.',
    'Follow your dreams. Ask the universe out loud.',
    'If all your actions line up, it arrives.',
    'The universe keeps no clock —',
    'so be just a little patient.',
    "That's the secret.",
  ],
  /** Part F — goodbye + signoff. */
  thanks: [
    'Thank you for wandering through a little of my life.',
    'No pressure at all…',
    '(life may or may not depend on it 😏 — kidding.)',
    'Hope you enjoyed it.',
    'Thank you, Ran — for the 3D pond, and for the door.', // [confirm wording]
  ],
  goodbyes: ['再见', 'see you next time', 'ciao', 'à bientôt'],
  signoff: [
    '— Alice (Zimeng) Wang.',
    'Still making my way through the mist.',
    'Still making every second count.',
  ],
  resumeLabel: 'Résumé',
  helloLabel: 'Say hello →',
  resumeUrl: '#', // [placeholder] Alice pastes the real resume link
  // Script says alicewang0089@gmail.com — using the account address; confirm.
  email: 'alicewang0022@gmail.com',
} as const;
