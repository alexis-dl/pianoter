import { Injectable } from '@angular/core';
import { BehaviorSubject, merge } from 'rxjs';
import {
  commonNoteName,
  findChord,
  intervalName,
  noteName,
  singleNoteName,
  spellChord,
  spellInterval,
} from './music/music-theory';
import { SettingsService } from './settings.service';

export interface NoteDisplay {
  /** Names of the notes played, spelled for what they make together. */
  noteNames: string[];
  /** The note, the interval or the chord they make. */
  label: string;
}

/** Notes held on the keyboard, and what they make (Learn page). */
@Injectable({ providedIn: 'root' })
export class NoteStateService {
  private activeIndices = new Set<number>();
  private readonly _display$ = new BehaviorSubject<NoteDisplay>({ noteNames: [], label: '' });
  readonly display$ = this._display$.asObservable();

  constructor(private settings: SettingsService) {
    // note names follow the notation, interval and chord names the language
    merge(this.settings.notation$, this.settings.language$).subscribe(() =>
      this.emit()
    );
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
    const notation = this.settings.notation;
    const language = this.settings.language;
    const name = (spelling: Parameters<typeof noteName>[0]) =>
      noteName(spelling, notation);

    // from the lowest note up, whatever the order the keys were pressed in
    const sorted = [...this.activeIndices].sort((a, b) => a - b);
    const pitchClasses = [...new Set(sorted.map(i => i % 12))];

    let noteNames: string[] = [];
    let label = '';
    if (pitchClasses.length === 1) {
      label = singleNoteName(pitchClasses[0], notation);
      noteNames = [label];
    } else if (pitchClasses.length === 2) {
      // pitchClasses[0] is the lowest note: the interval goes up from it
      const [lower, upper] = pitchClasses;
      noteNames = spellInterval(lower, upper).map(name);
      label = intervalName(upper - lower, language);
    } else if (pitchClasses.length >= 3) {
      const chord = findChord(pitchClasses);
      if (chord) {
        noteNames = spellChord(chord).map(name);
        label = `${noteNames[0]} ${chord.quality.name[language]}`;
      } else {
        noteNames = pitchClasses.map(pitch => commonNoteName(pitch, notation));
        label = noteNames.join(' + ');
      }
    }

    this._display$.next({ noteNames, label });
  }
}
