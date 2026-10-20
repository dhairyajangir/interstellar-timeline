// All visible content lives here.
// Assumptions (mirrored in DESIGN.md and the hand-off message):
//  - Murph is 10 when Cooper leaves.
//  - Durations the film never states (Miller orbit to Mann's world, the tesseract, the drift home)
//    are estimates. They carry `est: true` and are shown with "about" or "≈".
//  - Cooper's age at launch is not stated; we assume about 40, so "124 years old" means
//    ≈ 84 Earth years since launch and Murph ≈ 94 at the end.

export const site = {
  name: 'Two Clocks',
  title: 'Two Clocks: Interstellar in the order it happens',
  role: 'An unofficial timeline of Interstellar',
  url: 'https://interstellar-timeline.vercel.app',
  description:
    'Follow Interstellar in order, with two clocks side by side: hours for Cooper on the ship, years for Murph on Earth, and the gravity that pulls them apart.',
  film: { name: 'Interstellar', year: 2014, director: 'Christopher Nolan' },
};

/** Keep in sync with tokens.css (the sky shader reads these). */
export const palette = { void: '#060708', star: '#ece7dc', dust: '#c9b48f', soot: '#17130e' };

export const nav = [
  { label: 'Timeline', href: '/' },
  { label: 'How the clocks drift', href: '/time/' },
];

/** One keyframe of the two clocks. Years since the day Cooper leaves. */
export type Clock = { earth: number; ship: number; est?: boolean };

export type Chapter = {
  id: string;
  n: number;
  place: string;
  title: string;
  /** Archivo width for this chapter's title: narrow on Earth, wide where gravity is strong. */
  wdth: number;
  /** Earth time runs this many times faster than Cooper's (negative = the tesseract rewinds it). */
  rate: number;
  lede: string;
  body: string[];
  /** Clock values at the start and end of the chapter. */
  from: Clock;
  to: Clock;
  /** What the two clocks say about this chapter, in words. */
  clockNote: { cooper: string; earth: string };
};

const HOUR = 1 / 8766; // one hour in years

export const chapters: Chapter[] = [
  {
    id: 'earth',
    n: 1,
    place: 'Earth, Cooper’s farm',
    title: 'The dust years',
    wdth: 66,
    rate: 1,
    lede: 'Crops fail one after another. Corn is what is left, and the dust gets into everything.',
    body: [
      'Cooper used to fly for NASA. Now he farms, like nearly everyone, with his father-in-law Donald, his son Tom and his daughter Murph, who is ten.',
      'Murph is sure her room has a ghost. Books drop off her shelf by themselves. After a dust storm the dust settles across her floor in straight bands, and Cooper reads the bands as binary: a pair of map coordinates.',
    ],
    from: { earth: 0, ship: 0 },
    to: { earth: 0, ship: 0 },
    clockNote: {
      cooper: 'Not started. Every number on this page counts from the day he leaves.',
      earth: 'Year 0. Murph is ten.',
    },
  },
  {
    id: 'nasa',
    n: 2,
    place: 'A hidden base at the coordinates',
    title: 'What NASA kept quiet',
    wdth: 74,
    rate: 1,
    lede: 'The coordinates lead to NASA, still running in secret under Professor Brand.',
    body: [
      'Decades earlier a wormhole opened near Saturn, and it looks placed there on purpose. On the far side, worlds circle a supermassive black hole called Gargantua.',
      'Twelve volunteers already went through on the Lazarus missions, each to a different world. Three of them still send the signal that means come.',
      'Brand has two plans. Plan A: solve gravity, so the whole population can be lifted off Earth. Plan B: if that fails, the Endurance carries frozen embryos to start again somewhere new.',
      'Cooper agrees to fly. Murph refuses to say goodbye. He leaves her a watch that matches his own and promises to come back.',
    ],
    from: { earth: 0, ship: 0 },
    to: { earth: 0, ship: 0 },
    clockNote: {
      cooper: 'Launch. Both clocks start together.',
      earth: 'Year 0. Murph is ten and angry.',
    },
  },
  {
    id: 'wormhole',
    n: 3,
    place: 'Saturn',
    title: 'A door near Saturn',
    wdth: 86,
    rate: 1,
    lede: 'Getting to Saturn takes about two years, most of it asleep in cryo.',
    body: [
      'The crew is Cooper, Amelia Brand, Romilly and Doyle, with two robots, TARS and CASE.',
      'The wormhole is not a hole. It is a sphere, a ball of light that shows a different sky. The Endurance falls into it and comes out in another galaxy.',
    ],
    from: { earth: 0, ship: 0 },
    to: { earth: 2, ship: 2 },
    clockNote: {
      cooper: 'About two years. Far from anything heavy, his clock and Earth’s still agree.',
      earth: 'About two years. Murph is twelve.',
    },
  },
  {
    id: 'miller',
    n: 4,
    place: 'Miller’s planet',
    title: 'One hour, seven years',
    wdth: 125,
    rate: 61320,
    lede: 'Miller’s world orbits so close to Gargantua that every hour on its surface costs seven years everywhere else.',
    body: [
      'The water is ankle deep and flat to the horizon, until the horizon stands up. What looked like mountains are waves. Miller’s beacon came from wreckage, and for her the crash happened only hours ago.',
      'A wave kills Doyle, and the Ranger’s flooded engines take time to clear. By the time they lift off, the visit has cost decades.',
      'On the Endurance, Romilly has waited 23 years, 4 months and 8 days. Cooper sits down with 23 years of messages. Tom grows up, starts a family, loses a child. Then, for the first time, a grown woman named Murph speaks to the camera.',
    ],
    from: { earth: 2, ship: 2 },
    to: { earth: 2 + 23 + 4 / 12 + 8 / 365, ship: 2 + 3.34 * HOUR },
    clockNote: {
      cooper: 'About 3 hours 20 minutes on and near the surface.',
      earth: '23 years, 4 months, 8 days. Murph goes from twelve to about thirty-five.',
    },
  },
  {
    id: 'mann',
    n: 5,
    place: 'Mann’s planet',
    title: 'The frozen lie',
    wdth: 92,
    rate: 1,
    lede: 'Fuel is short now. They can try one more world, and they choose Mann’s.',
    body: [
      'Brand wants Edmunds’ world and admits she loves him. Cooper argues for Mann, whose data looks strongest. The planet is ice, with clouds frozen solid in the sky.',
      'A message arrives from Earth. Professor Brand has died, and before he did he told Murph the truth: he solved his equation long ago, and it cannot work without data from inside a black hole. Plan A was never going to happen.',
      'Mann faked his readings to get rescued. He cracks Cooper’s visor and leaves him to suffocate, a trap kills Romilly, and Mann wrecks part of the Endurance trying to dock. Cooper spins the Ranger to match the tumbling ship and locks on.',
    ],
    from: { earth: 2 + 23 + 4 / 12 + 8 / 365, ship: 2 + 3.34 * HOUR },
    to: { earth: 26, ship: 2.65, est: true },
    clockNote: {
      cooper: 'Months, the film never says how many. The clocks run close to even again.',
      earth: 'About the same. Murph is in her mid thirties, working on Brand’s equation.',
    },
  },
  {
    id: 'gargantua',
    n: 6,
    place: 'Gargantua',
    title: 'Falling into the black hole',
    wdth: 118,
    rate: -6,
    lede: 'To reach Edmunds’ world on what is left, they slingshot around Gargantua. The pass costs 51 years at home.',
    body: [
      'To lighten the ship, Cooper detaches his Ranger with TARS and drops toward the black hole, sending Brand on to Edmunds alone.',
      'He does not die. He lands in a tesseract, a space built, it seems, by humans from the far future, where Murph’s bedroom is laid out across every moment at once. Here time is a direction he can move along.',
      'He was the ghost. He pushes the books off the shelf. He draws the coordinates in the dust that sent him to NASA. He spells STAY, trying to stop himself from leaving.',
      'TARS hands him the data from inside the black hole. Cooper codes it into the second hand of the watch he left with Murph.',
    ],
    from: { earth: 26, ship: 2.65, est: true },
    to: { earth: 26.5, ship: 2.65, est: true },
    clockNote: {
      cooper: 'His clock stops meaning much. Inside the tesseract he moves through time like a corridor.',
      earth: 'Plus 51 years for the slingshot, then any year he likes: Murph at ten, Murph at thirty-six.',
    },
  },
  {
    id: 'murph',
    n: 7,
    place: 'Earth, the farmhouse',
    title: 'Murph’s answer',
    wdth: 80,
    rate: 1,
    lede: 'Grown up, Murph goes back to her childhood room and finds the watch ticking in a pattern.',
    body: [
      'She reads the second hand as Morse code and finishes the equation Professor Brand could not. The plan that was never real becomes real.',
      'People leave Earth in huge rotating habitats, lifted by the gravity she learned to control.',
    ],
    from: { earth: 26.5, ship: 2.65, est: true },
    to: { earth: 27, ship: 2.65, est: true },
    clockNote: {
      cooper: 'Still inside the black hole, sending.',
      earth: 'About year 27. Murph is about thirty-six.',
    },
  },
  {
    id: 'station',
    n: 8,
    place: 'Saturn orbit',
    title: 'Cooper Station',
    wdth: 100,
    rate: 1,
    lede: 'The tesseract folds away. Cooper drifts out near Saturn and is picked up by a station named after his daughter.',
    body: [
      'By the calendar he is 124. His body has lived only a few of those years.',
      'Murph is very old now, surrounded by the family she raised while he was gone. She tells him not to stay and watch her die, and to go after Brand, who is setting up camp alone on Edmunds’ world. He takes a ship and goes.',
    ],
    from: { earth: 27, ship: 2.65, est: true },
    to: { earth: 84, ship: 2.7, est: true },
    clockNote: {
      cooper: 'About 2.7 years lived since launch. Calendar age 124.',
      earth: 'About 84 years since launch. Murph is about 94.',
    },
  },
];

/** Ages side by side for the finale and the /time/ table. */
export const ledger = [
  { event: 'Cooper leaves', cooper: '0', earth: 'Year 0', murph: '10', source: 'Murph’s age widely given as ten' },
  { event: 'Through the wormhole', cooper: 'about 2 years', earth: 'about 2 years', murph: 'about 12', source: 'Stated: about two years to Saturn' },
  { event: 'Leaves Miller’s planet', cooper: '+ about 3 h 20 min', earth: '+ 23 years, 4 months, 8 days', murph: 'about 35', source: 'Stated: 1 hour = 7 years; Romilly’s count' },
  { event: 'Mann’s planet', cooper: '+ months', earth: '+ months', murph: 'about 36', source: 'Estimate' },
  { event: 'Gargantua slingshot', cooper: '+ hours', earth: '+ 51 years (for Brand)', murph: 'about 87 at home', source: 'Stated: the pass costs 51 years' },
  { event: 'Murph decodes the watch', cooper: 'outside time', earth: 'about year 27', murph: 'about 36', source: 'Estimate' },
  { event: 'Cooper Station', cooper: 'about 2.7 years lived', earth: 'about 84 years', murph: 'about 94', source: 'Stated: calendar age 124; rest assumes he left at about 40' },
];

export const MILLER_RATIO = 7 * 365 * 24; // Earth hours per surface hour (7 years per hour), 61,320
