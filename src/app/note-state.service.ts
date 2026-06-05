import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const NOTES_FR = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

const CHORDS: { intervals: number[]; suffix: string }[] = [
  { intervals: [0, 4, 7, 11], suffix: 'maj.7' },
  { intervals: [0, 3, 7, 10], suffix: 'm7' },
  { intervals: [0, 4, 7, 10], suffix: '7' },
  { intervals: [0, 4, 7],     suffix: 'majeur' },
  { intervals: [0, 3, 7],     suffix: 'mineur' },
  { intervals: [0, 3, 6],     suffix: 'dim.' },
  { intervals: [0, 4, 8],     suffix: 'aug.' },
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
    const pitchClasses = [...new Set([...this.activeIndices].map(i => i % 12))];
    const noteNames = pitchClasses.map(p => NOTES_FR[p]);

    let label = '';
    if (pitchClasses.length === 1) {
      label = NOTES_FR[pitchClasses[0]];
    } else if (pitchClasses.length === 2) {
      const diff = (pitchClasses[1] - pitchClasses[0] + 12) % 12;
      label = INTERVALS[diff] ?? noteNames.join(' + ');
    } else if (pitchClasses.length >= 3) {
      label = this.detectChord(pitchClasses) ?? noteNames.join(' + ');
    }

    this._display$.next({ noteNames, label });
  }

  private detectChord(pitchClasses: number[]): string | null {
    for (const root of pitchClasses) {
      const intervals = pitchClasses
        .map(p => (p - root + 12) % 12)
        .sort((a, b) => a - b);
      for (const chord of CHORDS) {
        if (chord.intervals.length === intervals.length &&
            chord.intervals.every((v, i) => v === intervals[i])) {
          return `${NOTES_FR[root]} ${chord.suffix}`;
        }
      }
    }
    return null;
  }
}
