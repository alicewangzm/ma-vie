/**
 * Block 02 "One Road, Two Sides" (University) — copy from STORY-SCRIPT.md.
 * Each beat may carry a visual cue the block triggers as the line lands.
 */
export type UniversityCue = 'waterloo' | 'laurier' | 'projects' | 'coop' | 'awards';

export const universityContent = {
  title: 'Chapter One — One Road, Two Sides',
  date: '2019 – 2024',
  beats: [
    { text: 'Most people pick a lane.' },
    { text: 'Alice walked one road —' },
    { text: 'and carried two sides of herself down it.' },
    { text: 'One side, all logic: Computer Science, with Distinction.', cue: 'waterloo' },
    { text: 'One side, all markets: Business, Finance, a minor in Economics.', cue: 'laurier' },
    { text: 'Same five years. Same road. Both at once.' },
    { text: 'Banking APIs — Java + Spring Boot. Money that moves safely.', cue: 'projects' },
    { text: 'Supplier Upload — React + Google Maps. Type an address, watch it finish itself.' },
    { text: 'Finance Research — 14,000 SEC files, wrangled by Python while she slept.' },
    { text: 'A co-op in San Francisco.', cue: 'coop' },
    { text: 'First taste of the city that keeps turning up in her dreams.' },
    { text: 'A Capstone bronze for a tiny startup called A Little Favour.', cue: 'awards' },
    { text: 'And a $10K welcome to a brand-new country.' },
    { text: "She didn't know it yet —" },
    { text: 'but she was already collecting pieces of a bigger picture.' },
  ] as readonly { text: string; cue?: UniversityCue }[],
  continueHint: 'follow the gold light',
  /** Cloud modals behind the ? buttons. Alice drops images into public/assets. */
  modals: {
    waterloo: {
      title: 'University of Waterloo — Computer Science',
      body: [
        '[placeholder] Bachelor of Computer Science, with Distinction.',
        '[placeholder] What those five years actually looked like.',
      ],
      images: [
        { src: 'assets/uw-1.jpg', alt: 'Waterloo photo 1' },
        { src: 'assets/uw-2.jpg', alt: 'Waterloo photo 2' },
      ],
    },
    laurier: {
      title: 'Wilfrid Laurier — Business & Finance',
      body: [
        '[placeholder] BBA — Finance, minor in Economics.',
        '[placeholder] The other side of the same road.',
      ],
      images: [{ src: 'assets/wlu-1.jpg', alt: 'Laurier photo' }],
    },
    projects: {
      title: 'Projects along the way',
      body: [
        'Banking APIs — Java + Spring Boot. [placeholder] What it does, why it mattered.',
        'Supplier Upload — React + Google Maps. [placeholder] Type an address, watch it finish itself.',
        'Finance Research — 14,000 SEC files, wrangled by Python overnight. [placeholder]',
      ],
      links: [
        { label: 'Banking APIs ↗', href: '#' }, // [placeholder link]
        { label: 'Supplier Upload ↗', href: '#' }, // [placeholder link]
      ],
    },
  },
} as const;
