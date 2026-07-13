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
      '[placeholder] The course / subjects Alice teaches at school.',
      '[placeholder] The science projects her students built.',
      '[placeholder] Why handing people tools feels like magic.',
    ],
    images: [
      { src: 'assets/teacher-science-0.jpg', alt: 'science class' },
      { src: 'assets/teacher-science-1.mp4', alt: 'science class clip' },
      { src: 'assets/teacher-science-2.jpg', alt: 'science class' },
      { src: 'assets/teacher-science-3.jpg', alt: 'student project' },
      { src: 'assets/teacher-science-4.jpg', alt: 'student project' },
    ],
  },
} as const;
