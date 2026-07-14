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
        'Bachelor of Computer Science, with Distinction.',
        'The architecture of a five-year horizon,',
        'An exploration of the projects, ideas, and spaces she shaped along the way',
      ],
      images: [
        { src: 'assets/uw-0.jpg', alt: 'Waterloo campus', caption: 'Waterloo' },
        { src: 'assets/uw-oasis-0.png', alt: 'Oasis project', caption: 'Oasis' },
        { src: 'assets/uw-oasis-1.png', alt: 'Oasis project', caption: 'Oasis' },
        {
          src: 'assets/uw-simpleFavour-0.png',
          alt: 'A Little Favour app',
          caption: 'A Little Favour — Capstone bronze',
        },
        { src: 'assets/uw-simpleFavour-1.png', alt: 'A Little Favour app' },
        { src: 'assets/uw-simpleFavour-2.png', alt: 'A Little Favour app' },
        { src: 'assets/uw-mHeart-0.jpg', alt: 'mHeart project', caption: 'mHeart' },
        { src: 'assets/uw-mHeart-1.jpg', alt: 'mHeart project' },
      ],
    },
    laurier: {
      title: 'Wilfrid Laurier University — Business & Finance',
      body: [
        'BBA — Finance, minor in Economics.',
        'The twin path, where code became conversation and the user became the focus.',
      ],
      images: [{ src: 'assets/wlu-0.jpg', alt: 'Laurier campus' }],
    },
    banking: {
      title: 'Banking APIs',
      body: [
        'Java + Spring Boot',
        'Created several RESTful banking APIs in Java using Spring Boot, enabling account creation,balance management, and secure fund transfers between accounts.',
        'Implemented a three-layer architecture, Controller-Service-Repository, with DTOs, dependency injection, and in-memory data storage for efficient data handling and maintainability',
      ],
      links: [
        { label: 'Banking APIs ↗', href: 'https://github.com/alicewangzm/banking-transaction' },
      ],
    },
    supplier: {
      title: 'Supplier Upload',
      body: [
        'React + Google Maps. Type an address, watch it finish itself.',
        'Designed and developed a full stack web application using React, Material UI, and TypeScript,enabling users to upload supplier logo, name and address',
        'Integrated Google Maps API to provide auto-complete address functionality, enhancing user experience and efficiency',
        'Leveraged Node.js, Express/CORS, and Firebase to create a robust backend server and database, facilitating image and text storage and processing',
      ],
      links: [
        { label: 'Supplier Upload ↗', href: 'https://github.com/alicewangzm/supplier-upload/' },
      ],
    },
    finance: {
      title: 'Finance Research',
      body: [
        'Built Python scripts using Pandas to process and analyze marketable-to-limit order ratio data from U.S. SEC reports spanning 2012–2023',
        'Automated the batch download of 14,000+ Excel files from SEC websites using Python for largescale data collection and preprocessing',
      ],
    },
    replicant: {
      title: 'Replicant — co-op, Startup in San Francisco',
      body: [
        'Replicant automates routine customer service across voice, chat, and text using conversational AI.',
        'Developed and published an internal NPM package written in Node.js and TypeScript to enable seamless purchasing and configuration of phone numbers by leveraging telephony provider REST APIs, successfully reduced 80% manual phone number configuration time',
        'Implemented a comprehensive testing suite by mocking HTTP requests using Jest framework, resulting in robust testing and secure compilation',
      ],
    },
  },
} as const;
