/** Block 05 "Where She Is Now" (Teaching) — copy from STORY-SCRIPT.md. */
export const teachingContent = {
  title: 'Chapter Four — Where She Is Now',
  lines: [
    'Then the clouds thickened,',
    'and the path forward went soft and white.',
    "When she couldn't see the road ahead…",
    'she decided to light one for someone else.',
    'Today, Alice teaches.',
    'She hands other people the tools',
    'that once felt like magic to her.',
    "It wasn't the plan.",
    'It might be the point.',
  ],
  continueHint: 'follow the gold light',
  /** Cloud modal behind the ? button — what she teaches now. */
  modal: {
    title: 'What Alice teaches',
    body: [
      'She builds spaces where wonder becomes creation',
      "Teaching middle and high school STEM isn't about memorizing formulas.",
      'It is about building the future with your own hands.',
      'Whether it is tracing logic with Scratch Cat or mapping the basics of autonomous driving,',
      'her classroom turns science and technology into active verbs. ',
      'Because she believes passion drives everything forward,',
      'she tells her kids to stay curious.',
    ],
    images: [
      { src: 'assets/teacher-science-0.jpg', alt: 'Tensegrity Structure' },
      { src: 'assets/teacher-science-1.mp4', alt: 'Solar Updraft Tower' },
      { src: 'assets/teacher-science-2.jpg', alt: "Owl' Pellet" },
      { src: 'assets/teacher-science-3.jpg', alt: 'Skull and Claw' },
      { src: 'assets/teacher-science-4.jpg', alt: 'Traditional Chinese Lacquer Fan' },
    ],
  },
} as const;
