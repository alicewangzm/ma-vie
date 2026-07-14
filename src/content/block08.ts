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
  reveal: ['So — who is Alice?', 'I am.', 'Not a traditional UX designer —'],
  rotatingTitles: [
    'A Curiosity-Powered Builder',
    'An AI Engineer',
    'An Educator',
    'An Aspiring Recreational Pilot',
    'A Hello, World Explorer',
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
        body: [
          'Finding Peace Through Sound.',
          'She is not a professional musician, but music is where she rests.',
          'Alice plays a bit of piano, a little bit of ukulele, and a tiny bit of guitar.',
        ],
        images: [
          {
            src: 'assets/hobby-musician-piano.mp4',
            alt: 'Alice at the piano playing Pirates of the Caribbean theme song for 8 seconds',
            caption: 'piano',
          },
          {
            src: 'assets/hobby-musician-ukulele.mp4',
            alt: 'Alice on ukulele singing Shadow of the Sun',
            caption: 'ukulele',
          },
        ],
      },
    },
    {
      word: 'baker',
      color: '#d9a441',
      modal: {
        title: 'baker',
        body: [
          'Finding sweetness in the unexpected.',
          'She loves to surprise her family and friends with homemade cakes.',
        ],
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
        body: [
          'A collector of small wonders.',
          'Capturing the magical moments hidden in plain sight.',
          'Through watercolors, videos, and photography, she records the little spots of unexpected happiness around her.',
        ],
        images: [
          {
            src: 'assets/hobby-artist-painter.jpg',
            alt: 'a painting by Alice',
            caption: 'painter',
          },
          {
            src: 'assets/hobby-artist-videoEditor-0.mp4',
            alt: 'a video Alice edited about maple leaves in algonquin park, ontario',
            caption: 'video editor',
          },
          {
            src: 'assets/hobby-artist-videoEditor-1.mp4',
            alt: 'a video Alice edited about komodo island and scuba diving with manta',
          },
          {
            src: 'assets/hobby-artist-photographer-0.jpg',
            alt: 'photo by Alice',
            caption: 'photographer',
          },
          {
            src: 'assets/hobby-artist-photographer-1.jpg',
            alt: 'photo by Alice - lightning in clouds',
          },
          {
            src: 'assets/hobby-artist-photographer-2.jpg',
            alt: 'photo by Alice - clouds with crepuscular rays',
          },
          { src: 'assets/hobby-artist-photographer-3.jpg', alt: 'photo by Alice - red sun' },
          {
            src: 'assets/hobby-artist-photographer-4.jpg',
            alt: 'photo by Alice - sunset after rain',
          },
          { src: 'assets/hobby-artist-photographer-5.jpg', alt: 'photo by Alice - rainbow clouds' },
          { src: 'assets/hobby-artist-photographer-6.jpg', alt: 'photo by Alice - sunset' },
          {
            src: 'assets/hobby-artist-photographer-7.jpg',
            alt: 'photo by Alice - one giant tree with blue sky and green grass at the back',
          },
          {
            src: 'assets/hobby-artist-photographer-8.jpg',
            alt: 'photo by Alice - maple leave with red,yellow,green leaves',
          },
          {
            src: 'assets/hobby-artist-photographer-9.jpg',
            alt: 'photo by Alice - Milky way at Torrance Barrens Dark-Sky Preserve, Toronto',
          },
        ],
      },
    },
    {
      word: 'athlete',
      color: '#5b8bd9',
      modal: {
        title: 'athlete',
        body: [
          'Chasing the joy of staying active.',
          'Bungee jumping, hiking, archery, rock climbing, table tennis, badminton, pilates, running...',
          'She loves to collect experiences, touching every sport here and there.',
          'Enjoying every bit of this game called life.',
        ],
        images: [
          {
            src: 'assets/hobby-athlete-bungeeJumping.mp4',
            alt: 'Alice bungee jumping',
            caption: 'bungee jumping',
          },
          { src: 'assets/hobby-athlete-hiking.jpg', alt: 'Alice hiking in ice', caption: 'hiking' },
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
          'The storyteller behind the camera and the screen.',
          'Pitching Pika to content creators by writing scripts and acting through three entirely different minds:',
          'the fast-paced driver, the logical analyst, and the warm, amiable connector.',
          'An amateur director exploring the world, one story and one role at a time.',
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
    'one channel is the builder, shaping code and character behind the screen.',
    'one is the quiet soul, finding peace in micro-moments, music, and baking.',
    "and one is the endless sky, and the part of me that won't stop dreaming.",
    "Apart, they're just light.",
    "Together, they're a whole person.",
  ],
  /** Part E — the reward + wishes. */
  reward: [
    'Remember the reward from the letter?',
    'If walking through this brought a small smile —',
    'that was it. 🥇',
    'Here is your tiny drop of happiness.',
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
    'No pressure at all...',
    'Even if making this dream a reality is just one "Offer" button away. 😉 (No pressure, JUST kidding!)',
    'Hope you enjoyed it.',
    'Thank you, Ran — for sharing this amazing opportunity!',
    'And thank you, everyone, for watching until the very end.',
  ],
  goodbyes: ['再见', 'See you next time', 'À bientôt', 'Ciao'],
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
