/**
 * Preloaded ringtones. Only public-domain music (classical works, folk
 * songs): film or TV themes are still under copyright.
 */
import type { Localized } from '../i18n/locale';

export interface CatalogEntry {
  readonly id: string;
  readonly title: Localized;
  /** Composer or origin, shown under the title. */
  readonly origin: Localized;
  readonly rtttl: string;
}

export const CLASSICS: readonly CatalogEntry[] = [
  {
    id: 'nokia-tune',
    title: { fr: 'Nokia Tune', en: 'Nokia Tune' },
    origin: {
      fr: 'Francisco Tárrega, Gran Vals (1902)',
      en: 'Francisco Tárrega, Gran Vals (1902)',
    },
    rtttl: 'Nokia Tune:d=4,o=5,b=225:8e6,8d6,f#,g#,8c#6,8b,d,e,8b,8a,c#,e,2a',
  },
  {
    id: 'tetris',
    title: { fr: 'Tetris', en: 'Tetris' },
    origin: {
      fr: 'Korobeiniki, chanson populaire russe',
      en: 'Korobeiniki, Russian folk song',
    },
    rtttl:
      'Tetris:d=4,o=5,b=160:e6,8b,8c6,8d6,16e6,16d6,8c6,8b,a,8a,8c6,e6,8d6,8c6,b,8b,8c6,d6,e6,c6,a,2a,8p,d6,8f6,a6,8g6,8f6,e6,8e6,8c6,e6,8d6,8c6,b,8b,8c6,d6,e6,c6,a,a',
  },
  {
    id: 'fur-elise',
    title: { fr: 'Lettre à Élise', en: 'Für Elise' },
    origin: { fr: 'Ludwig van Beethoven', en: 'Ludwig van Beethoven' },
    rtttl:
      'Fur Elise:d=8,o=5,b=125:32p,e6,d#6,e6,d#6,e6,b,d6,c6,4a.,32p,c,e,a,4b.,32p,e,g#,b,4c.6,32p,e,e6,d#6,e6,d#6,e6,b,d6,c6,4a.,32p,c,e,a,4b.,32p,e,c6,b,2a',
  },
  {
    id: 'ode-to-joy',
    title: { fr: 'Hymne à la joie', en: 'Ode to Joy' },
    origin: {
      fr: 'Ludwig van Beethoven, 9ᵉ symphonie',
      en: 'Ludwig van Beethoven, Symphony No. 9',
    },
    rtttl:
      'Ode to Joy:d=4,o=5,b=140:e,e,f,g,g,f,e,d,c,c,d,e,e.,8d,2d,e,e,f,g,g,f,e,d,c,c,d,e,d.,8c,2c',
  },
  {
    id: 'turkish-march',
    title: { fr: 'Marche turque', en: 'Turkish March' },
    origin: { fr: 'Wolfgang Amadeus Mozart', en: 'Wolfgang Amadeus Mozart' },
    rtttl:
      'Turkish March:d=16,o=5,b=120:b,a,g#,a,4c6,d6,c6,b,c6,4e6,f6,e6,d#6,e6,b6,a6,g#6,a6,b6,a6,g#6,a6,4c7',
  },
  {
    id: 'mountain-king',
    title: {
      fr: 'Dans l’antre du roi de la montagne',
      en: 'In the Hall of the Mountain King',
    },
    origin: { fr: 'Edvard Grieg, Peer Gynt', en: 'Edvard Grieg, Peer Gynt' },
    rtttl:
      'Mountain King:d=8,o=5,b=140:a,b,c6,d6,e6,c6,4e6,d#6,b,4d#6,d6,a#,4d6,a,b,c6,d6,e6,c6,e6,a6,g6,e6,c6,e6,2g6',
  },
  {
    id: 'can-can',
    title: { fr: 'French cancan', en: 'Can-can' },
    origin: {
      fr: 'Jacques Offenbach, Orphée aux Enfers',
      en: 'Jacques Offenbach, Orpheus in the Underworld',
    },
    rtttl:
      'Can-can:d=8,o=5,b=200:4c,d,f,e,d,4g,4g,g,a,e,f,4d,4d,d,f,e,d,c,c6,b,a,g,f,e,d',
  },
  {
    id: 'entertainer',
    title: { fr: 'The Entertainer', en: 'The Entertainer' },
    origin: { fr: 'Scott Joplin (1902)', en: 'Scott Joplin (1902)' },
    rtttl:
      'Entertainer:d=4,o=5,b=140:8d,8d#,8e,c6,8e,c6,8e,2c.6,8c6,8d6,8d#6,8e6,8c6,8d6,e6,8b,d6,2c6,p,8d,8d#,8e,c6,8e,c6,8e,2c.6,8p,8a,8g,8f#,8a,8c6,e6,8d6,8c6,8a,2d6',
  },
  {
    id: 'toccata',
    title: {
      fr: 'Toccata et fugue en ré mineur',
      en: 'Toccata and Fugue in D minor',
    },
    origin: { fr: 'Jean-Sébastien Bach', en: 'Johann Sebastian Bach' },
    rtttl:
      'Toccata:d=16,o=5,b=60:a6,g6,4a6,8p,32g6,32f6,32e6,32d6,8c#6,4d6,8p,a,g,4a,8p,32e,32f,32c#,8d,4p',
  },
  {
    id: 'greensleeves',
    title: { fr: 'Greensleeves', en: 'Greensleeves' },
    origin: { fr: 'Chanson populaire anglaise', en: 'English folk song' },
    rtttl:
      'Greensleeves:d=4,o=5,b=140:a,2c6,d6,e.6,8f6,e6,2d6,b,g.,8a,b,2c6,a,a.,8g#,a,2b,g#,2e,a,2c6,d6,e.6,8f6,e6,2d6,b,g.,8a,b,c.6,8b,a,g#.,8f#,g#,2a.',
  },
  {
    id: 'frere-jacques',
    title: { fr: 'Frère Jacques', en: 'Frère Jacques' },
    origin: { fr: 'Comptine traditionnelle', en: 'Traditional nursery rhyme' },
    rtttl:
      'Frere Jacques:d=4,o=5,b=120:c,d,e,c,c,d,e,c,e,f,2g,e,f,2g,8g,8a,8g,8f,e,c,8g,8a,8g,8f,e,c,c,g4,2c,c,g4,2c',
  },
  {
    id: 'happy-birthday',
    title: { fr: 'Joyeux anniversaire', en: 'Happy Birthday' },
    origin: { fr: 'Mildred et Patty Hill', en: 'Mildred and Patty Hill' },
    rtttl:
      'Happy Birthday:d=4,o=5,b=125:8g.,16g,a,g,c6,2b,8g.,16g,a,g,d6,2c6,8g.,16g,g6,e6,c6,b,a,8f6.,16f6,e6,c6,d6,2c6',
  },
  {
    id: 'jingle-bells',
    title: { fr: 'Vive le vent', en: 'Jingle Bells' },
    origin: {
      fr: 'James Lord Pierpont, Jingle Bells',
      en: 'James Lord Pierpont',
    },
    rtttl:
      'Jingle Bells:d=8,o=5,b=112:e,e,4e,e,e,4e,e,g,c.,16d,2e,f,f,f.,16f,f,e,e,16e,16e,e,d,d,e,4d,4g',
  },
  {
    id: 'la-cucaracha',
    title: { fr: 'La Cucaracha', en: 'La Cucaracha' },
    origin: { fr: 'Chanson populaire mexicaine', en: 'Mexican folk song' },
    rtttl:
      'La Cucaracha:d=8,o=5,b=140:c,c,c,4f,4a,c,c,c,4f,4a,4p,4f,f,e,e,d,d,2c',
  },
];
