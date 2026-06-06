import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, HostListener, inject } from '@angular/core';
import { IPianoKey } from './ipiano-key';
import { CommonModule } from '@angular/common';
import { combineLatest, Subscription } from 'rxjs';
import { NoteStateService } from '../note-state.service';
import { ScaleService } from '../scale/scale.service';

const BASE_NOTES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
const WHITE_IN_OCTAVE = [0, 2, 4, 5, 7, 9, 11];
const HAS_BLACK_LEFT = new Set([2, 4, 7, 9, 11]);
const START_OCTAVE: Record<number, number> = { 1: 4, 2: 3, 3: 3, 4: 2 };

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

  private readonly audioContext = new AudioContext();
  private readonly audioBuffers = new Map<string, AudioBuffer>();
  private readonly activeNodes = new Map<number, { source: AudioBufferSourceNode; gain: GainNode }>();

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
      this.buildKeys();
      this.updateScaleHighlight(this.lastPitchClasses, this.lastRoot);
    }
  }

  ngOnInit(): void {
    this.buildKeys();
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
    this.noteState.reset();
    this.scaleSub?.unsubscribe();
  }

  private buildKeys(): void {
    // Stop any playing audio
    this.activeNodes.forEach(({ source }) => { try { source.stop(); } catch { /* already stopped */ } });
    this.activeNodes.clear();
    this.highlightedKeyIds.clear();
    this.noteState.reset();

    const octaves = this.size;
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

    if (this.audioContext.state === 'suspended') await this.audioContext.resume();

    if (!this.audioBuffers.has(note)) {
      const response = await fetch(`assets/sounds/piano-sounds/${note}.mp3`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(note, audioBuffer);
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffers.get(note)!;
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(1, this.audioContext.currentTime);
    source.connect(gain);
    gain.connect(this.audioContext.destination);
    source.start();
    this.activeNodes.set(noteIndex, { source, gain });
  }

  private stopNoteByIndex(noteIndex: number, fadeTime = 0.15): void {
    const keyIds = this.noteToKeyIds.get(noteIndex) || [];
    keyIds.forEach(id => this.highlightedKeyIds.delete(id));
    this.noteState.release(noteIndex);
    this.stopAudio(noteIndex, fadeTime);
  }

  private stopAudio(noteIndex: number, fadeTime = 0): void {
    const nodes = this.activeNodes.get(noteIndex);
    if (!nodes) return;
    const { source, gain } = nodes;
    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + fadeTime);
    source.stop(now + fadeTime);
    this.activeNodes.delete(noteIndex);
  }
}
