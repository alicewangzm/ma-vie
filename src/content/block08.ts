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
  rotatingTitles: [
    'builder',
    'programmer',
    'prompt engineer',
    'teacher',
    'future pilot (manifesting)',
  ],
  revealOutro: 'and a little bit of everything.',
  /**
   * Part C — clickable colored words. `color` is a seed: at runtime each
   * hobby takes the real color of its region of alice.jpg (cloth, skin,
   * hair…), and clicking sends that color back into the portrait exactly
   * where it was sampled from.
   */
  everythingLead: 'a little bit of a…',
  everythingTip: 'tap a word',
  hobbies: [
    {
      word: 'musician',
      color: '#e8734a',
      modal: {
        title: 'musician',
        body: ['[placeholder] What Alice plays, since when, and for whom.'],
        images: [
          { src: 'assets/hobby-musician-piano.mp4', alt: 'Alice at the piano', caption: 'piano' },
          { src: 'assets/hobby-musician-ukulele.mp4', alt: 'Alice on ukulele', caption: 'ukulele' },
        ],
      },
    },
    {
      word: 'baker',
      color: '#d9a441',
      modal: {
        title: 'baker',
        body: ['[placeholder] The kitchen story — what she bakes on rainy days.'],
        images: [
          { src: 'assets/hobby-baker-0.jpg', alt: 'fresh from the oven' },
          { src: 'assets/hobby-baker-1.jpg', alt: 'fresh from the oven' },
          { src: 'assets/hobby-baker-2.jpg', alt: 'fresh from the oven' },
          { src: 'assets/hobby-baker-3.jpg', alt: 'fresh from the oven' },
          { src: 'assets/hobby-baker-4.jpg', alt: 'fresh from the oven' },
          { src: 'assets/hobby-baker-5.jpg', alt: 'fresh from the oven' },
          { src: 'assets/hobby-baker-6.jpg', alt: 'fresh from the oven' },
          { src: 'assets/hobby-baker-7.jpg', alt: 'fresh from the oven' },
          { src: 'assets/hobby-baker-8.jpg', alt: 'fresh from the oven' },
          { src: 'assets/hobby-baker-9.jpg', alt: 'fresh from the oven' },
        ],
      },
    },
    {
      word: 'artist',
      color: '#7a9e6b',
      modal: {
        title: 'artist',
        body: ['[placeholder] Small watercolors, big feelings.'],
        images: [
          {
            src: 'assets/hobby-artist-painter.jpg',
            alt: 'a painting by Alice',
            caption: 'painter',
          },
          {
            src: 'assets/hobby-artist-videoEditor-0.mp4',
            alt: 'a video Alice edited',
            caption: 'video editor',
          },
          { src: 'assets/hobby-artist-videoEditor-1.mp4', alt: 'a video Alice edited' },
          {
            src: 'assets/hobby-artist-photographer-0.jpg',
            alt: 'photo by Alice',
            caption: 'photographer',
          },
          { src: 'assets/hobby-artist-photographer-1.jpg', alt: 'photo by Alice' },
          { src: 'assets/hobby-artist-photographer-2.jpg', alt: 'photo by Alice' },
          { src: 'assets/hobby-artist-photographer-3.jpg', alt: 'photo by Alice' },
          { src: 'assets/hobby-artist-photographer-4.jpg', alt: 'photo by Alice' },
          { src: 'assets/hobby-artist-photographer-5.jpg', alt: 'photo by Alice' },
          { src: 'assets/hobby-artist-photographer-6.jpg', alt: 'photo by Alice' },
          { src: 'assets/hobby-artist-photographer-7.jpg', alt: 'photo by Alice' },
          { src: 'assets/hobby-artist-photographer-8.jpg', alt: 'photo by Alice' },
          { src: 'assets/hobby-artist-photographer-9.jpg', alt: 'photo by Alice' },
        ],
      },
    },
    {
      word: 'athlete',
      color: '#5b8bd9',
      modal: {
        title: 'athlete',
        body: ['[placeholder] The sport that clears her head.'],
        images: [
          {
            src: 'assets/hobby-athlete-bungeeJumping.mp4',
            alt: 'Alice bungee jumping',
            caption: 'bungee jumping',
          },
          { src: 'assets/hobby-athlete-hiking.jpg', alt: 'Alice hiking', caption: 'hiking' },
          {
            src: 'assets/hobby-athlete-tabletennis-0.jpg',
            alt: 'table tennis',
            caption: 'table tennis',
          },
          { src: 'assets/hobby-athlete-tabletennis-1.jpg', alt: 'table tennis' },
        ],
      },
    },
    {
      word: 'storyteller',
      color: '#9b6bb3',
      modal: {
        title: 'storyteller',
        body: [
          '[placeholder] Behind and in front of the camera — directing, acting, cutting the reel.',
        ],
        images: [
          {
            src: 'assets/hobby-amateurDirectorActor.mp4',
            alt: 'Alice directing and acting',
            caption: 'amateur director · actor',
          },
        ],
      },
    },
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
  // served as a static file — drop resume.pdf into public/ and it deploys
  resumeUrl: 'resume.pdf',
  email: 'alicewang0089@gmail.com', // per STORY-SCRIPT.md, confirmed by Alice
} as const;
