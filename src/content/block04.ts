/** Block 04 "Building in the Rain" (Alethea Medical) — copy from STORY-SCRIPT.md. */
export const aletheaContent = {
  title: 'Chapter Three — Building in the Rain',
  date: '2025',
  lines: [
    "The sky didn't clear all at once.",
    'But she kept building anyway.',
    'On a medical-software team in Calgary, ',
    'that is where you could find her, doing Full Stack development work',
  ],
  continueHint: 'follow the gold light',
  /** Cloud modal behind the ? on the Alethea board. */
  modal: {
    title: 'Alethea Medical — Full Stack Developer, Calgary',
    body: [
      'Participated in full product lifecycle across sprints—defined requirements with PMs, implemented features, deployed to staging/production, and performed regression testing.',
      'Integrated Stripe APIs for premium subscriptions, including webhooks, billing UI, and customer portal; built email workflows for transactional and marketing events.',
      'Refactored UI with React, TypeScript, and MUI into modular components; built editing interfaces, expandable sections, and snackbar alerts; enabled hot-reload across platforms (Vite,Android, iOS), cutting mobile test cycles by 75%.',
      'Modeled and synced structured data between Firebase and TypeSense; extended backend schemas and resolved critical cross-system consistency issues.',
      'Implemented testing infrastructure using Vitest, covering unit, integration, and UI test layers.',
      'Used Faker and custom factories to simulate realistic backend data, delivered clean tests.',
    ],
  },
} as const;
