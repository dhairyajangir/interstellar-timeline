// Every photograph on the site, graded by scripts/grade.mjs into public/img.
// Public-domain sources are credited by agency and archive. Film stills belong to the studios (film: true marks them; drop them here to remove them site-wide).
import sizes from './images.json';

export type Photo = { name: keyof typeof sizes; alt: string; credit: string; film?: boolean; tone?: 'void' | 'dust' };

const WH = 'Ray traced for this site through the film’s wormhole metric, over NASA star maps, Cassini and Hubble (public domain).';
const FILM = '© Warner Bros. Entertainment and Paramount Pictures. Film still, shown for commentary.';

export const photos = {
  saturn: { name: 'saturn-backlit', alt: 'Saturn seen from behind, its rings lit by the Sun in a thin bright halo.', credit: 'Cassini, NASA/JPL-Caltech/Space Science Institute, 2013.' },
  blackhole: { name: 'blackhole', alt: 'Simulated black hole seen nearly edge on: a bright disk of gas bent over and under a dark centre.', credit: 'Simulation by Jeremy Schnittman, NASA Goddard, 2019.' },
  colony: { name: 'colony', alt: 'Painting of the inside of a rotating space colony, farmland curving up the walls toward a central window.', credit: 'Space colony study, NASA Ames Research Center, 1976.' },
  earthLimb: { name: 'earth-limb', alt: 'The curve of the Earth from orbit at sunrise, with the Sun breaking over the edge.', credit: 'International Space Station, Expedition 40, NASA, 2014.' },
  antarctic: { name: 'antarctic', alt: 'Jagged ice under a smooth lens-shaped cloud that looks frozen in place.', credit: 'Antarctica, NASA Goddard Space Flight Center.' },
  dustTown: { name: 'dust-town', alt: 'Farm machinery buried in drifted soil outside a small town during the Dust Bowl.', credit: 'Dallas, South Dakota, 1936. USDA photograph, public domain.', tone: 'dust' },
  plungeDisk: { name: 'plunge-flyby', alt: 'Close to the black hole, the glowing disk smears into flat bright bands across the sky.', credit: 'Simulated plunge by Jeremy Schnittman and Brian P. Powell, NASA Goddard, 2024.' },
  plungeHorizon: { name: 'plunge-horizon', alt: 'Near the event horizon the whole sky, Milky Way and all, bends into a bowl above a thin bright line.', credit: 'Simulated plunge by Jeremy Schnittman and Brian P. Powell, NASA Goddard, 2024.' },
  plungeRing: { name: 'plunge-ring', alt: 'Falling in: the photon ring stretched into a single bright curve that bends down out of view.', credit: 'Simulated plunge by Jeremy Schnittman and Brian P. Powell, NASA Goddard, 2024.' },
  tesseract: { name: 'tesseract', alt: 'The tesseract set: bookshelf edges stretched into long bands that run off into the dark in every direction.', credit: '© Warner Bros. Entertainment and Paramount Pictures. Production still of the tesseract set, shown for commentary.', film: true },
  hubbleLens: { name: 'hubble-lens', alt: 'A real gravitational lens: two bright galaxies inside a thin arc of stretched light from a galaxy far behind them.', credit: 'Galaxy cluster SDSS J1038+4849, Hubble Space Telescope, NASA and ESA.' },
  wormholeThroat: { name: 'wormhole-throat', alt: 'The Milky Way bent into one long dark-edged curve around the throat of the wormhole.', credit: '© Warner Bros. Entertainment, Paramount Pictures and DNEG. Wormhole render from Visualizing Interstellar’s Wormhole, shown for commentary.', film: true },
  whSaturn: { name: 'wh-saturn', alt: 'Saturn and its rings beside a small bright sphere; around the sphere the stars bend into a ring.', credit: WH },
  whNear: { name: 'wh-near', alt: 'Close to the wormhole: a ball showing another galaxy, its edge wrapped in the stretched-out Milky Way.', credit: WH },
  whRim: { name: 'wh-rim', alt: 'At the mouth: the far galaxy fills the view while our sky shrinks to a thin bright band.', credit: WH },
  whFar: { name: 'wh-far', alt: 'Out the other side: a new sky of unfamiliar stars and a galaxy close by.', credit: WH },
  whHome: { name: 'wh-home', alt: 'Looking back from the far side: our Milky Way and Saturn, squeezed inside a sphere.', credit: WH },
  cornfield: { name: 'cornfield', alt: 'Murph, ten, leans on the truck at the edge of the corn while Cooper looks down at her.', credit: FILM, film: true, tone: 'dust' },
  nasaTable: { name: 'nasa-table', alt: 'Murph sits beside Cooper at a table in the hidden NASA base, watching the man across from them.', credit: FILM, film: true, tone: 'dust' },
  cooperLeaving: { name: 'cooper-leaving', alt: 'Cooper at the wheel of the dusty truck, driving away from the farm.', credit: FILM, film: true, tone: 'dust' },
  murphBoard: { name: 'murph-blackboard', alt: 'Murph, grown up, in a lab coat in front of a blackboard covered in gravity equations.', credit: FILM, film: true, tone: 'dust' },
  faceCooper: { name: 'face-cooper', alt: '', credit: FILM, film: true },
  faceMurphYoung: { name: 'face-murph-young', alt: '', credit: FILM, film: true, tone: 'dust' },
  faceMurph: { name: 'face-murph', alt: '', credit: FILM, film: true, tone: 'dust' },
  ranger: { name: 'ranger', alt: 'The Ranger’s flat hull close up as it lines up with the spinning ring of the Endurance.', credit: FILM, film: true },
  tarsMiller: { name: 'tars-miller', alt: 'TARS, a robot of four tall slabs, striding through shallow water on Miller’s planet.', credit: FILM, film: true },
  gargantuaFilm: { name: 'gargantua-film', alt: 'Gargantua’s glowing disk arching over the black hole, with a tiny ship against it.', credit: FILM, film: true },
  watch: { name: 'watch', alt: 'Close up of the face of Cooper’s wristwatch, its second hand caught mid tick.', credit: FILM, film: true, tone: 'dust' },
} satisfies Record<string, Photo>;

export const size = (p: Photo) => sizes[p.name];
