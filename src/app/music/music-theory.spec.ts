import {
  findChord,
  intervalName,
  noteName,
  ScaleType,
  singleNoteName,
  spellChord,
  spellInterval,
  spellScale,
} from './music-theory';

const names = (spellings: ReturnType<typeof spellScale>, notation: 'latin' | 'anglo' = 'latin') =>
  spellings.map(spelling => noteName(spelling, notation)).join(' ');

describe('music theory', () => {
  describe('scales', () => {
    const TYPES: ScaleType[] = ['major', 'minor', 'harmonic-minor'];

    for (const type of TYPES) {
      it(`uses each letter once in every ${type} scale`, () => {
        for (let root = 0; root < 12; root++) {
          const letters = spellScale(root, type).map(s => s.letter);
          expect(new Set(letters).size).withContext(`root ${root}`).toBe(7);
        }
      });
    }

    it('writes flats and sharps as on a score', () => {
      expect(names(spellScale(0, 'major'))).toBe('Do Ré Mi Fa Sol La Si');
      expect(names(spellScale(5, 'major'))).toBe('Fa Sol La Si♭ Do Ré Mi');
      expect(names(spellScale(2, 'major'))).toBe('Ré Mi Fa♯ Sol La Si Do♯');
      expect(names(spellScale(10, 'major'))).toBe('Si♭ Do Ré Mi♭ Fa Sol La');
      expect(names(spellScale(1, 'major'))).toBe('Ré♭ Mi♭ Fa Sol♭ La♭ Si♭ Do');
      expect(names(spellScale(6, 'major'))).toBe('Fa♯ Sol♯ La♯ Si Do♯ Ré♯ Mi♯');
    });

    it('names minor keys by their usual root', () => {
      expect(names(spellScale(9, 'minor'))).toBe('La Si Do Ré Mi Fa Sol');
      expect(names(spellScale(1, 'minor'))).toBe('Do♯ Ré♯ Mi Fa♯ Sol♯ La Si');
      expect(names(spellScale(3, 'minor'))).toBe('Mi♭ Fa Sol♭ La♭ Si♭ Do♭ Ré♭');
    });

    it('raises the seventh of the harmonic minor, double sharp if needed', () => {
      expect(names(spellScale(9, 'harmonic-minor'))).toBe('La Si Do Ré Mi Fa Sol♯');
      expect(names(spellScale(8, 'harmonic-minor'), 'anglo')).toBe(
        'G♯ A♯ B C♯ D♯ E F♯♯'
      );
    });
  });

  describe('notes and intervals', () => {
    it('gives both names of a black key heard alone', () => {
      expect(singleNoteName(0, 'latin')).toBe('Do');
      expect(singleNoteName(1, 'latin')).toBe('Do♯ / Ré♭');
      expect(singleNoteName(10, 'anglo')).toBe('A♯ / B♭');
    });

    it('spells the upper note of an interval from the lower one', () => {
      const pair = (lower: number, upper: number) =>
        spellInterval(lower, upper).map(s => noteName(s, 'latin')).join(' ');
      expect(pair(0, 3)).toBe('Do Mi♭'); // minor third
      expect(pair(0, 6)).toBe('Do Fa♯'); // tritone, as an augmented fourth
      expect(pair(1, 4)).toBe('Do♯ Mi');
      expect(pair(10, 2)).toBe('Si♭ Ré');
    });

    it('names intervals in the chosen language', () => {
      expect(intervalName(4, 'fr')).toBe('Tierce majeure');
      expect(intervalName(4, 'en')).toBe('Major third');
      expect(intervalName(7, 'en')).toBe('Perfect fifth');
      expect(intervalName(-3, 'fr')).toBe('Sixte majeure');
    });
  });

  describe('chords', () => {
    const chord = (...pitchClasses: number[]) => {
      const found = findChord(pitchClasses);
      return found
        ? `${spellChord(found).map(s => noteName(s, 'latin')).join(' ')} (${found.quality.name.en})`
        : null;
    };

    it('stacks the notes in thirds from the root, in any inversion', () => {
      expect(chord(3, 7, 10)).toBe('Mi♭ Sol Si♭ (major)');
      expect(chord(7, 10, 3)).toBe('Mi♭ Sol Si♭ (major)');
      expect(chord(1, 4, 8)).toBe('Do♯ Mi Sol♯ (minor)');
      expect(chord(11, 2, 5)).toBe('Si Ré Fa (dim)');
      expect(chord(8, 0, 4)).toBe('La♭ Do Mi (aug)');
      expect(chord(7, 11, 2, 5)).toBe('Sol Si Ré Fa (7)');
      expect(chord(10, 2, 5, 9)).toBe('Si♭ Ré Fa La (maj7)');
    });

    it('finds no chord in a cluster', () => {
      expect(chord(0, 1, 2)).toBeNull();
    });
  });
});
