import {
  Component,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { IPianoKey } from './ipiano-key';
import { CommonModule } from '@angular/common';
import { combineLatest, Subscription } from 'rxjs';
import { NoteStateService } from '../note-state.service';
import { ScaleService } from '../scale/scale.service';
import { PianoAudioService, PlayingNote } from '../audio/piano-audio.service';

const BASE_NOTES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
const WHITE_IN_OCTAVE = [0, 2, 4, 5, 7, 9, 11];
const HAS_BLACK_LEFT = new Set([2, 4, 7, 9, 11]);
const START_OCTAVE: Record<number, number> = { 1: 4, 2: 3, 3: 3, 4: 2 };
/** Narrowest white key still easy to play with a finger. */
const MIN_WHITE_KEY_PX = 26;
/** Room around the keyboard: page margins and the keyboard's frame. */
const PAGE_MARGIN_PX = 60;

@Component({
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.scss'],
  imports: [CommonModule],
  standalone: true,
})
export class KeyboardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() highlightScale = false;
  @Input() size: 1 | 2 | 3 | 4 = 4;

  private noteState = inject(NoteStateService);
  private scaleService = inject(ScaleService);
  private scaleSub?: Subscription;
  private lastPitchClasses: Set<number> | null = null;
  private lastRoot: number | null = null;

  pianoKeys: IPianoKey[] = [];
  highlightedKeyIds = new Set<number>();
  protected scaleKeyIds = new Set<number>();
  protected rootKeyIds = new Set<number>();

  private fullNotes: string[] = [];
  private noteToKeyIds = new Map<number, number[]>();
  private keyIdToNoteIndex = new Map<number, number>();

  private audio = inject(PianoAudioService);
  /** Notes sounding, by note index. */
  private readonly playing = new Map<number, PlayingNote>();
  /**
   * Press in progress for each held note: a sample that finishes loading
   * after its key was released (or pressed again) must not be played.
   */
  private readonly presses = new Map<number, number>();
  private lastPress = 0;
  /** Octaves that fit in the width given to the keyboard. */
  private fittingOctaves = 4;
  private builtOctaves = 0;
  /** Pointers down (finger on the screen, mouse button pressed). */
  private readonly activePointers = new Set<number>();
  /** Key held by each pointer down. */
  private readonly pointerKeys = new Map<number, number>();

  // AZERTY mapping — indices are relative to the keyboard's first note
  private readonly azertyMap: Record<string, number> = {
    a:0, z:1, e:2, r:3, t:4, y:5, u:6, i:7, o:8, p:9, '[':10, ']':11,
    q:12, s:13, d:14, f:15, g:16, h:17, j:18, k:19, l:20, m:21, 'ù':22, '*':23,
    w:24, x:25, c:26, v:27, b:28, n:29, ',':30, ';':31, ':':32, '/':33, '?':34, '.':35,
    '1':36, '2':37, '3':38, '4':39, '5':40, '6':41, '7':42, '8':43, '9':44, '0':45, '-':46, '=':47,
    '`':48,
  };

  private keyboardMap = this.azertyMap;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['size'] && !changes['size'].isFirstChange()) {
      this.rebuildIfNeeded();
    }
  }

  /**
   * Octaves displayed: the size chosen in the settings, fewer when the
   * screen is too narrow for the keys to stay playable with a finger.
   */
  get octaves(): 1 | 2 | 3 | 4 {
    return Math.min(this.size, this.fittingOctaves) as 1 | 2 | 3 | 4;
  }

  ngOnInit(): void {
    this.buildKeys();
    this.onWindowResize();
    this.scaleSub = combineLatest([
      this.scaleService.activePitchClasses$,
      this.scaleService.root$,
    ]).subscribe(([pitchClasses, root]) => {
      this.lastPitchClasses = pitchClasses;
      this.lastRoot = root;
      this.updateScaleHighlight(pitchClasses, root);
    });
  }

  ngOnDestroy(): void {
    this.stopAll();
    this.noteState.reset();
    this.scaleSub?.unsubscribe();
  }

  /** Number of white keys, read by the styles to size the keyboard. */
  @HostBinding('style.--white-keys')
  get whiteKeyCount(): number {
    return this.pianoKeys.length;
  }

  /**
   * The pages center their content: the keyboard takes its width from the
   * window (see the styles), and so does the number of octaves that fit.
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    const width = window.innerWidth - PAGE_MARGIN_PX;
    // 7 white keys per octave, plus the last C
    const fitting = Math.floor((width / MIN_WHITE_KEY_PX - 1) / 7);
    this.fittingOctaves = Math.max(1, Math.min(4, fitting));
    this.rebuildIfNeeded();
  }

  /** Rebuild the keys when the number of octaves displayed changes. */
  private rebuildIfNeeded(): void {
    if (this.octaves !== this.builtOctaves) {
      this.buildKeys();
      this.updateScaleHighlight(this.lastPitchClasses, this.lastRoot);
    }
  }

  private stopAll(): void {
    this.playing.forEach(note => note.stop());
    this.playing.clear();
    this.presses.clear();
    this.pointerKeys.clear();
    this.activePointers.clear();
  }

  private buildKeys(): void {
    this.stopAll();
    this.highlightedKeyIds.clear();
    this.noteState.reset();

    const octaves = this.octaves;
    this.builtOctaves = octaves;
    const startOct = START_OCTAVE[octaves];

    // Build fullNotes
    this.fullNotes = [];
    for (let o = startOct; o < startOct + octaves; o++) {
      BASE_NOTES.forEach(n => this.fullNotes.push(`${n}${o}`));
    }
    this.fullNotes.push(`C${startOct + octaves}`);

    // Build pianoKeys — keyId === noteIndex for simplicity
    this.pianoKeys = [];
    for (let oct = 0; oct < octaves; oct++) {
      for (const pos of WHITE_IN_OCTAVE) {
        const idx = oct * 12 + pos;
        this.pianoKeys.push(HAS_BLACK_LEFT.has(pos)
          ? { whiteKeyId: idx, blackKeyId: idx - 1 }
          : { whiteKeyId: idx });
      }
    }
    this.pianoKeys.push({ whiteKeyId: octaves * 12 });

    // Build maps
    this.noteToKeyIds.clear();
    this.keyIdToNoteIndex.clear();
    for (let i = 0; i < this.fullNotes.length; i++) {
      this.noteToKeyIds.set(i, [i]);
      this.keyIdToNoteIndex.set(i, i);
    }
  }

  private updateScaleHighlight(pitchClasses: Set<number> | null, root: number | null): void {
    const scale = new Set<number>();
    const roots = new Set<number>();
    if (pitchClasses !== null && root !== null) {
      this.keyIdToNoteIndex.forEach((noteIndex, keyId) => {
        const pc = noteIndex % 12;
        if (pc === root % 12) roots.add(keyId);
        else if (pitchClasses.has(pc)) scale.add(keyId);
      });
    }
    this.scaleKeyIds = scale;
    this.rootKeyIds = roots;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    const idx = this.keyboardMap[key];
    if (idx !== undefined && idx < this.fullNotes.length) {
      event.preventDefault();
      this.startNoteByIndex(idx);
    }
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const idx = this.keyboardMap[key];
    if (idx !== undefined && idx < this.fullNotes.length) {
      this.stopNoteByIndex(idx);
    }
  }

  // ----- pointers: mouse, fingers (several at once for chords) and pen -----

  onPointerDown(event: PointerEvent, keyId: number): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault(); // no text selection, no emulated mouse events
    // a touch is captured by the key it starts on: release it, so that
    // sliding the finger onto the next keys plays them (glissando)
    const target = event.target as Element | null;
    if (target?.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    this.activePointers.add(event.pointerId);
    this.holdKey(event.pointerId, keyId);
  }

  /** A held pointer (finger down, mouse button down) slides onto a key. */
  onPointerEnter(event: PointerEvent, keyId: number): void {
    if (this.activePointers.has(event.pointerId)) {
      this.holdKey(event.pointerId, keyId);
    }
  }

  /** It slides off the key: the pointer stays held for the next key. */
  onPointerLeave(event: PointerEvent, keyId: number): void {
    if (this.pointerKeys.get(event.pointerId) === keyId) {
      this.pointerKeys.delete(event.pointerId);
      this.releaseIfFree(keyId);
    }
  }

  /** Listened on the whole page: the finger may be lifted off the keyboard. */
  @HostListener('document:pointerup', ['$event'])
  @HostListener('document:pointercancel', ['$event'])
  onPointerUp(event: PointerEvent): void {
    this.activePointers.delete(event.pointerId);
    const keyId = this.pointerKeys.get(event.pointerId);
    this.pointerKeys.delete(event.pointerId);
    if (keyId !== undefined) {
      this.releaseIfFree(keyId);
    }
  }

  private holdKey(pointerId: number, keyId: number): void {
    const previous = this.pointerKeys.get(pointerId);
    if (previous === keyId) return;
    const alreadyHeld = [...this.pointerKeys.values()].includes(keyId);
    this.pointerKeys.set(pointerId, keyId);
    if (previous !== undefined) {
      this.releaseIfFree(previous);
    }
    if (!alreadyHeld) {
      this.keyPress(keyId); // another finger on the same key: no restart
    }
  }

  /** Release a key, unless another pointer still holds it. */
  private releaseIfFree(keyId: number): void {
    if (![...this.pointerKeys.values()].includes(keyId)) {
      this.keyRelease(keyId);
    }
  }

  keyPress(keyId: number): void {
    const noteIndex = this.keyIdToNoteIndex.get(keyId);
    if (noteIndex === undefined) return;
    this.startNoteByIndex(noteIndex);
  }

  keyRelease(keyId: number): void {
    const noteIndex = this.keyIdToNoteIndex.get(keyId);
    if (noteIndex === undefined) return;
    this.stopNoteByIndex(noteIndex);
  }

  private async startNoteByIndex(noteIndex: number): Promise<void> {
    const note = this.fullNotes[noteIndex];
    if (!note) return;
    const keyIds = this.noteToKeyIds.get(noteIndex) || [];
    this.stopAudio(noteIndex);
    keyIds.forEach(id => this.highlightedKeyIds.add(id));
    this.noteState.press(noteIndex);

    const press = ++this.lastPress;
    this.presses.set(noteIndex, press);
    // the first time, the sample is downloaded: the key may be released
    // (or pressed again) before it is ready
    const buffer = await this.audio.load(note);
    if (!buffer || this.presses.get(noteIndex) !== press) return;

    const playing = this.audio.play(buffer);
    if (playing) {
      this.playing.set(noteIndex, playing);
    }
  }

  private stopNoteByIndex(noteIndex: number, fadeTime = 0.15): void {
    const keyIds = this.noteToKeyIds.get(noteIndex) || [];
    keyIds.forEach(id => this.highlightedKeyIds.delete(id));
    this.noteState.release(noteIndex);
    this.presses.delete(noteIndex);
    this.stopAudio(noteIndex, fadeTime);
  }

  private stopAudio(noteIndex: number, fadeTime = 0): void {
    this.playing.get(noteIndex)?.stop(fadeTime);
    this.playing.delete(noteIndex);
  }
}
