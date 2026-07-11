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
} as const;
