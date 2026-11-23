import type { Language, NotationSystem } from '../settings.service';

/**
 * Note names, spelled as on a score: in a scale every letter is used once
 * (F major has B♭, not A♯), and a chord is stacked in thirds from its root
 * (E♭ G B♭, not D♯ G A♯).
 *
 * Pitch classes: 0 = C ... 11 = B. Letters: 0 = C, 1 = D ... 6 = B.
 */

/** A spelled note: a letter and its accidental (-2 = ♭♭ ... +2 = ♯♯). */
export interface Spelling {
  letter: number;
  accidental: number;
}

export type ScaleType = 'major' | 'minor' | 'harmonic-minor';

const LETTERS: Record<NotationSystem, string[]> = {
  latin: ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'],
  anglo: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
};
/** Pitch class of each natural note (C D E F G A B). */
const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const ACCIDENTALS: Record<number, string> = {
  [-2]: '♭♭',
  [-1]: '♭',
  0: '',
  1: '♯',
  2: '♯♯',
};

export const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
};

/**
 * Usual name of the root of a major or minor key, for each pitch class:
 * D♭ major but C♯ minor, A♭ major but G♯ minor...
 */
const MAJOR_ROOTS: Spelling[] = [
  { letter: 0, accidental: 0 }, // C
  { letter: 1, accidental: -1 }, // D♭
  { letter: 1, accidental: 0 }, // D
  { letter: 2, accidental: -1 }, // E♭
  { letter: 2, accidental: 0 }, // E
  { letter: 3, accidental: 0 }, // F
  { letter: 3, accidental: 1 }, // F♯
  { letter: 4, accidental: 0 }, // G
  { letter: 5, accidental: -1 }, // A♭
  { letter: 5, accidental: 0 }, // A
  { letter: 6, accidental: -1 }, // B♭
  { letter: 6, accidental: 0 }, // B
];
const MINOR_ROOTS: Spelling[] = [
  { letter: 0, accidental: 0 }, // C
  { letter: 0, accidental: 1 }, // C♯
  { letter: 1, accidental: 0 }, // D
  { letter: 2, accidental: -1 }, // E♭
  { letter: 2, accidental: 0 }, // E
  { letter: 3, accidental: 0 }, // F
  { letter: 3, accidental: 1 }, // F♯
  { letter: 4, accidental: 0 }, // G
  { letter: 4, accidental: 1 }, // G♯
  { letter: 5, accidental: 0 }, // A
  { letter: 6, accidental: -1 }, // B♭
  { letter: 6, accidental: 0 }, // B
];

export function noteName(spelling: Spelling, notation: NotationSystem): string {
  return LETTERS[notation][spelling.letter] + ACCIDENTALS[spelling.accidental];
}

/** The note of this letter that sounds as this pitch class. */
function spellWithLetter(pitchClass: number, letter: number): Spelling {
  const wrapped = ((letter % 7) + 7) % 7; // e.g. a seventh above A: G
  // smallest difference between the pitch and the natural note, in -6..5
  const accidental = ((pitchClass - NATURAL[wrapped] + 18) % 12) - 6;
  return { letter: wrapped, accidental };
}

/** Usual name of a key's root (D♭ major, C♯ minor). */
export function rootSpelling(pitchClass: number, minor: boolean): Spelling {
  return (minor ? MINOR_ROOTS : MAJOR_ROOTS)[pitchClass];
}

/** The 7 notes of a scale, one per letter from the root. */
export function spellScale(root: number, type: ScaleType): Spelling[] {
  const rootName = rootSpelling(root, type !== 'major');
  return SCALE_INTERVALS[type].map((interval, degree) =>
    spellWithLetter((root + interval) % 12, (rootName.letter + degree) % 7)
  );
}

/** Names of the pitch classes in a scale, by pitch class. */
export function scaleNames(
  root: number,
  type: ScaleType,
  notation: NotationSystem
): Map<number, string> {
  const names = new Map<number, string>();
  spellScale(root, type).forEach((spelling, degree) =>
    names.set((root + SCALE_INTERVALS[type][degree]) % 12, noteName(spelling, notation))
  );
  return names;
}

/**
 * A note heard alone: its name, or both names on a black key
 * ('Do♯ / Ré♭'), since nothing tells which one is meant.
 */
export function singleNoteName(pitchClass: number, notation: NotationSystem): string {
  const natural = NATURAL.indexOf(pitchClass);
  if (natural >= 0) {
    return LETTERS[notation][natural];
  }
  const sharp = spellWithLetter(pitchClass, NATURAL.indexOf(pitchClass - 1));
  const flat = spellWithLetter(pitchClass, NATURAL.indexOf(pitchClass + 1));
  return `${noteName(sharp, notation)} / ${noteName(flat, notation)}`;
}

// ----- intervals -----

/** Letters between the two notes of each interval, by number of semitones. */
const INTERVAL_STEPS = [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6];

const INTERVAL_NAMES: Record<Language, string[]> = {
  fr: [
    'Unisson',
    'Seconde mineure',
    'Seconde majeure',
    'Tierce mineure',
    'Tierce majeure',
    'Quarte juste',
    'Triton',
    'Quinte juste',
    'Sixte mineure',
    'Sixte majeure',
    'Septième mineure',
    'Septième majeure',
  ],
  en: [
    'Unison',
    'Minor second',
    'Major second',
    'Minor third',
    'Major third',
    'Perfect fourth',
    'Tritone',
    'Perfect fifth',
    'Minor sixth',
    'Major sixth',
    'Minor seventh',
    'Major seventh',
  ],
};

export function intervalName(semitones: number, language: Language): string {
  return INTERVAL_NAMES[language][((semitones % 12) + 12) % 12];
}

/**
 * The two notes of an interval, the upper one spelled from the lower one
 * (a minor third above C is E♭, not D♯).
 */
export function spellInterval(lower: number, upper: number): [Spelling, Spelling] {
  const bottom = defaultSpelling(lower);
  const semitones = (upper - lower + 12) % 12;
  return [bottom, spellWithLetter(upper, bottom.letter + INTERVAL_STEPS[semitones])];
}

/** A pitch class out of context: the usual sharp or flat (C♯ E♭ F♯ A♭ B♭). */
const DEFAULT_SPELLINGS: Spelling[] = [
  { letter: 0, accidental: 0 }, // C
  { letter: 0, accidental: 1 }, // C♯
  { letter: 1, accidental: 0 }, // D
  { letter: 2, accidental: -1 }, // E♭
  { letter: 2, accidental: 0 }, // E
  { letter: 3, accidental: 0 }, // F
  { letter: 3, accidental: 1 }, // F♯
  { letter: 4, accidental: 0 }, // G
  { letter: 5, accidental: -1 }, // A♭
  { letter: 5, accidental: 0 }, // A
  { letter: 6, accidental: -1 }, // B♭
  { letter: 6, accidental: 0 }, // B
];

function defaultSpelling(pitchClass: number): Spelling {
  return DEFAULT_SPELLINGS[pitchClass];
}

/** Name of a note among others that make no chord: the usual spelling. */
export function commonNoteName(pitchClass: number, notation: NotationSystem): string {
  return noteName(defaultSpelling(pitchClass), notation);
}

// ----- chords -----

export interface ChordQuality {
  /** Semitones above the root, sorted. */
  intervals: number[];
  minor: boolean;
  name: Record<Language, string>;
}

/** Recognized chords, the four-note ones first. */
export const CHORDS: ChordQuality[] = [
  { intervals: [0, 4, 7, 11], minor: false, name: { fr: 'maj.7', en: 'maj7' } },
  { intervals: [0, 3, 7, 10], minor: true, name: { fr: 'm7', en: 'm7' } },
  { intervals: [0, 4, 7, 10], minor: false, name: { fr: '7', en: '7' } },
  { intervals: [0, 4, 7], minor: false, name: { fr: 'majeur', en: 'major' } },
  { intervals: [0, 3, 7], minor: true, name: { fr: 'mineur', en: 'minor' } },
  { intervals: [0, 3, 6], minor: true, name: { fr: 'dim.', en: 'dim' } },
  { intervals: [0, 4, 8], minor: false, name: { fr: 'aug.', en: 'aug' } },
];

/** Letters above the root of each chord note: third, fifth, seventh. */
const CHORD_STEPS: Record<number, number> = {
  0: 0,
  3: 2,
  4: 2,
  6: 4,
  7: 4,
  8: 4,
  10: 6,
  11: 6,
};

export interface Chord {
  root: number;
  quality: ChordQuality;
}

/** The chord made by these pitch classes, in any inversion. */
export function findChord(pitchClasses: number[]): Chord | null {
  for (const root of pitchClasses) {
    const intervals = pitchClasses
      .map(pitch => (pitch - root + 12) % 12)
      .sort((a, b) => a - b);
    const quality = CHORDS.find(
      chord =>
        chord.intervals.length === intervals.length &&
        chord.intervals.every((value, i) => value === intervals[i])
    );
    if (quality) {
      return { root, quality };
    }
  }
  return null;
}

/** The notes of a chord, stacked in thirds from its root. */
export function spellChord(chord: Chord): Spelling[] {
  const root = rootSpelling(chord.root, chord.quality.minor);
  return chord.quality.intervals.map(interval =>
    spellWithLetter((chord.root + interval) % 12, root.letter + CHORD_STEPS[interval])
  );
}
