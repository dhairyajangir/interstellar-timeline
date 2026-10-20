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
  ranger: { name: 'ranger', alt: 'The Ranger’s flat hull close up as it lines up with the spinning ring of the Endurance.', credit: FILM, film: true },
  tarsMiller: { name: 'tars-miller', alt: 'TARS, a robot of four tall slabs, striding through shallow water on Miller’s planet.', credit: FILM, film: true },
  gargantuaFilm: { name: 'gargantua-film', alt: 'Gargantua’s glowing disk arching over the black hole, with a tiny ship against it.', credit: FILM, film: true },
  watch: { name: 'watch', alt: 'Close up of the face of Cooper’s wristwatch, its second hand caught mid tick.', credit: FILM, film: true, tone: 'dust' },
} satisfies Record<string, Photo>;

export const size = (p: Photo) => sizes[p.name];
