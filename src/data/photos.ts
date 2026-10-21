// Every photograph on the site, graded by scripts/grade.mjs into public/img.
// Public-domain sources are credited by agency and archive. Film stills were supplied by the site
// owner and belong to the studios (film: true marks them; drop them here to remove them site-wide).
import sizes from './images.json';

export type Photo = { name: keyof typeof sizes; alt: string; credit: string; film?: boolean; tone?: 'void' | 'dust' };

const FILM = '© Warner Bros. Entertainment and Paramount Pictures. Film still, shown for commentary.';

export const photos = {
  saturn: { name: 'saturn-backlit', alt: 'Saturn seen from behind, its rings lit by the Sun in a thin bright halo.', credit: 'Cassini, NASA/JPL-Caltech/Space Science Institute, 2013.' },
  saturnNight: { name: 'saturn-night', alt: 'Saturn’s night side with the rings cutting across the dark planet.', credit: 'Cassini, NASA/JPL-Caltech/Space Science Institute, 2012.' },
  blackhole: { name: 'blackhole', alt: 'Simulated black hole seen nearly edge on: a bright disk of gas bent over and under a dark centre.', credit: 'Simulation by Jeremy Schnittman, NASA Goddard, 2019.' },
  colony: { name: 'colony', alt: 'Painting of the inside of a rotating space colony, farmland curving up the walls toward a central window.', credit: 'Space colony study, NASA Ames Research Center, 1976.' },
  earthLimb: { name: 'earth-limb', alt: 'The curve of the Earth from orbit at sunrise, with the Sun breaking over the edge.', credit: 'International Space Station, Expedition 40, NASA, 2014.' },
  antarctic: { name: 'antarctic', alt: 'Jagged ice under a smooth lens-shaped cloud that looks frozen in place.', credit: 'Antarctica, NASA Goddard Space Flight Center.' },
  dustStorm: { name: 'dust-storm', alt: 'A farmer and his sons walk to a shed half buried in drifted dust as a storm rolls in.', credit: 'Arthur Rothstein, Cimarron County, Oklahoma, 1936. Library of Congress.', tone: 'dust' },
  dustTown: { name: 'dust-town', alt: 'Farm machinery buried in drifted soil outside a small town during the Dust Bowl.', credit: 'Dallas, South Dakota, 1936. USDA photograph, public domain.', tone: 'dust' },
  plungeDisk: { name: 'plunge-flyby', alt: 'Close to the black hole, the glowing disk smears into flat bright bands across the sky.', credit: 'Simulated plunge by Jeremy Schnittman and Brian P. Powell, NASA Goddard, 2024.' },
  plungeHorizon: { name: 'plunge-horizon', alt: 'Near the event horizon the whole sky, Milky Way and all, bends into a bowl above a thin bright line.', credit: 'Simulated plunge by Jeremy Schnittman and Brian P. Powell, NASA Goddard, 2024.' },
  plungeRing: { name: 'plunge-ring', alt: 'Falling in: the photon ring stretched into a single bright curve that bends down out of view.', credit: 'Simulated plunge by Jeremy Schnittman and Brian P. Powell, NASA Goddard, 2024.' },
  tesseract: { name: 'tesseract', alt: 'The tesseract set: bookshelf edges stretched into long bands that run off into the dark in every direction.', credit: '© Warner Bros. Entertainment and Paramount Pictures. Production still of the tesseract set, shown for commentary.', film: true },
  wormholeSphere: { name: 'wormhole-sphere', alt: 'A sphere hanging in a field of distant galaxies: around it the galaxies smear into arcs and a thin bright ring; inside it glows a different, warm galaxy.', credit: 'Rendered for this site from the Hubble eXtreme Deep Field and a Hubble spiral galaxy (NASA, public domain), bent with a point-lens model.' },
  wormholeTunnel: { name: 'wormhole-tunnel', alt: 'Galaxies stretched into streaks rushing out from a single point.', credit: 'Rendered for this site from the Hubble eXtreme Deep Field (NASA, public domain).' },
  hubbleLens: { name: 'hubble-lens', alt: 'A real gravitational lens: two bright galaxies inside a thin arc of stretched light from a galaxy far behind them.', credit: 'Galaxy cluster SDSS J1038+4849, Hubble Space Telescope, NASA and ESA.' },
  wormholeLensed: { name: 'wormhole-lensed', alt: 'Inside the wormhole’s pull: clouds of a far galaxy smeared and folded across the dark.', credit: '© Warner Bros. Entertainment, Paramount Pictures and DNEG. Wormhole render from Visualizing Interstellar’s Wormhole, shown for commentary.', film: true },
  wormholeThroat: { name: 'wormhole-throat', alt: 'The Milky Way bent into one long dark-edged curve around the throat of the wormhole.', credit: '© Warner Bros. Entertainment, Paramount Pictures and DNEG. Wormhole render from Visualizing Interstellar’s Wormhole, shown for commentary.', film: true },
  wormholeFar: { name: 'wormhole-farside', alt: 'The far side: a new sky crowded with nebulae and galaxies.', credit: '© Warner Bros. Entertainment, Paramount Pictures and DNEG. Wormhole render from Visualizing Interstellar’s Wormhole, shown for commentary.', film: true },
  ranger: { name: 'ranger', alt: 'The Ranger’s flat hull close up as it lines up with the spinning ring of the Endurance.', credit: FILM, film: true },
  tarsMiller: { name: 'tars-miller', alt: 'TARS, a robot of four tall slabs, striding through shallow water on Miller’s planet.', credit: FILM, film: true },
  gargantuaFilm: { name: 'gargantua-film', alt: 'Gargantua’s glowing disk arching over the black hole, with a tiny ship against it.', credit: FILM, film: true },
  watch: { name: 'watch', alt: 'Close up of the face of Cooper’s wristwatch, its second hand caught mid tick.', credit: FILM, film: true, tone: 'dust' },
} satisfies Record<string, Photo>;

export const size = (p: Photo) => sizes[p.name];
