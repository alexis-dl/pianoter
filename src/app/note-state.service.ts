import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SettingsService } from './settings.service';

const NOTES_LATIN = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const NOTES_ANGLO = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CHORDS_LATIN: { intervals: number[]; suffix: string }[] = [
  { intervals: [0, 4, 7, 11], suffix: 'maj.7' },
  { intervals: [0, 3, 7, 10], suffix: 'm7' },
  { intervals: [0, 4, 7, 10], suffix: '7' },
  { intervals: [0, 4, 7],     suffix: 'majeur' },
  { intervals: [0, 3, 7],     suffix: 'mineur' },
  { intervals: [0, 3, 6],     suffix: 'dim.' },
  { intervals: [0, 4, 8],     suffix: 'aug.' },
];

const CHORDS_ANGLO: { intervals: number[]; suffix: string }[] = [
  { intervals: [0, 4, 7, 11], suffix: 'maj7' },
  { intervals: [0, 3, 7, 10], suffix: 'm7' },
  { intervals: [0, 4, 7, 10], suffix: '7' },
  { intervals: [0, 4, 7],     suffix: 'maj' },
  { intervals: [0, 3, 7],     suffix: 'min' },
  { intervals: [0, 3, 6],     suffix: 'dim' },
  { intervals: [0, 4, 8],     suffix: 'aug' },
];

const INTERVALS: Record<number, string> = {
  1: 'Seconde mineure', 2: 'Seconde majeure',
  3: 'Tierce mineure',  4: 'Tierce majeure',
  5: 'Quarte',          6: 'Triton',
  7: 'Quinte',          8: 'Sixte mineure',
  9: 'Sixte majeure',   10: 'Septième min.',
  11: 'Septième maj.',
};

export interface NoteDisplay {
  noteNames: string[];
  label: string;
}

@Injectable({ providedIn: 'root' })
export class NoteStateService {
  private activeIndices = new Set<number>();
  private readonly _display$ = new BehaviorSubject<NoteDisplay>({ noteNames: [], label: '' });
  readonly display$ = this._display$.asObservable();

  constructor(private settings: SettingsService) {
    this.settings.notation$.subscribe(() => this.emit());
  }

  press(noteIndex: number): void {
    this.activeIndices.add(noteIndex);
    this.emit();
  }

  release(noteIndex: number): void {
    this.activeIndices.delete(noteIndex);
    this.emit();
  }

  reset(): void {
    this.activeIndices.clear();
    this.emit();
  }

  private emit(): void {
    const notes = this.settings.notation === 'anglo' ? NOTES_ANGLO : NOTES_LATIN;
    const chords = this.settings.notation === 'anglo' ? CHORDS_ANGLO : CHORDS_LATIN;

    const pitchClasses = [...new Set([...this.activeIndices].map(i => i % 12))];
    const noteNames = pitchClasses.map(p => notes[p]);

    let label = '';
    if (pitchClasses.length === 1) {
      label = notes[pitchClasses[0]];
    } else if (pitchClasses.length === 2) {
      const diff = (pitchClasses[1] - pitchClasses[0] + 12) % 12;
      label = INTERVALS[diff] ?? noteNames.join(' + ');
    } else if (pitchClasses.length >= 3) {
      label = this.detectChord(pitchClasses, notes, chords) ?? noteNames.join(' + ');
    }

    this._display$.next({ noteNames, label });
  }

  private detectChord(
    pitchClasses: number[],
    notes: string[],
    chords: { intervals: number[]; suffix: string }[]
  ): string | null {
    for (const root of pitchClasses) {
      const intervals = pitchClasses
        .map(p => (p - root + 12) % 12)
        .sort((a, b) => a - b);
      for (const chord of chords) {
        if (chord.intervals.length === intervals.length &&
            chord.intervals.every((v, i) => v === intervals[i])) {
          return `${notes[root]} ${chord.suffix}`;
        }
      }
    }
    return null;
  }
}