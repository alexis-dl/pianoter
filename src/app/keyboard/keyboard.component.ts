import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { IPianoKey } from './ipiano-key';
import { CommonModule } from '@angular/common';
import { NoteStateService } from '../note-state.service';
// notes range will be generated dynamically (C2 to C6)

@Component({
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.scss'],
  imports: [CommonModule],
  standalone: true,
})
export class KeyboardComponent implements OnInit, OnDestroy {
  private noteState = inject(NoteStateService);
  pianoKeys: IPianoKey[];
  highlightedKeyIds: Set<number> = new Set();

  // list of 49 notes from C2 to C6
  private fullNotes: string[] = [];

  // QWERTY mapping
  private qwertyMap: { [key: string]: number } = {
    q: 0, // Q -> C
    '2': 1, // 2 -> C#
    w: 2, // W -> D
    '3': 3, // 3 -> D#
    e: 4, // E -> E
    r: 5, // R -> F
    '5': 6, // 5 -> F#
    t: 7, // T -> G
    '6': 8, // 6 -> G#
    y: 9, // Y -> A
    '7': 10, // 7 -> A#
    u: 11, // U -> B
  };

  // AZERTY mapping (French/Belgian) - full 49 notes from C2 to C6
  private azertyMap: { [key: string]: number } = {
    // Row 1: C2-B2 (indices 0-11)
    a: 0, // A -> C2
    z: 1, // Z -> C#2
    e: 2, // E -> D2
    r: 3, // R -> D#2
    t: 4, // T -> E2
    y: 5, // Y -> F2
    u: 6, // U -> F#2
    i: 7, // I -> G2
    o: 8, // O -> G#2
    p: 9, // P -> A2
    '[': 10, // [ -> A#2
    ']': 11, // ] -> B2

    // Row 2: C3-B3 (indices 12-23)
    q: 12, // Q -> C3
    s: 13, // S -> C#3
    d: 14, // D -> D3
    f: 15, // F -> D#3
    g: 16, // G -> E3
    h: 17, // H -> F3
    j: 18, // J -> F#3
    k: 19, // K -> G3
    l: 20, // L -> G#3
    m: 21, // M -> A3
    ù: 22, // Ù -> A#3
    '*': 23, // * -> B3

    // Row 3: C4-B4 (indices 24-35)
    w: 24, // W -> C4
    x: 25, // X -> C#4
    c: 26, // C -> D4
    v: 27, // V -> D#4
    b: 28, // B -> E4
    n: 29, // N -> F4
    ',': 30, // , -> F#4
    ';': 31, // ; -> G4
    ':': 32, // : -> G#4
    '/': 33, // / -> A4
    '?': 34, // ? -> A#4
    '.': 35, // . -> B4

    // Row 4: C5-B5 (indices 36-47)
    '1': 36, // 1 -> C5
    '2': 37, // 2 -> C#5
    '3': 38, // 3 -> D5
    '4': 39, // 4 -> D#5
    '5': 40, // 5 -> E5
    '6': 41, // 6 -> F5
    '7': 42, // 7 -> F#5
    '8': 43, // 8 -> G5
    '9': 44, // 9 -> G#5
    '0': 45, // 0 -> A5
    '-': 46, // - -> A#5
    '=': 47, // = -> B5

    // Extra: C6 (index 48)
    '`': 48, // ` -> C6
  };

  private keyboardMap: { [key: string]: number } = this.qwertyMap;

  private noteToKeyIds: Map<number, number[]> = new Map();
  private keyIdToNoteIndex: Map<number, number> = new Map();
  private audioContext = new AudioContext();
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeNodes: Map<number, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();

  constructor() {
    // build key definitions (unchanged)
    this.pianoKeys = [
      { whiteKeyId: 16 },
      { whiteKeyId: 18, blackKeyId: 17 },
      { whiteKeyId: 20, blackKeyId: 19 },
      { whiteKeyId: 21 },
      { whiteKeyId: 23, blackKeyId: 22 },
      { whiteKeyId: 25, blackKeyId: 24 },
      { whiteKeyId: 27, blackKeyId: 26 },
      { whiteKeyId: 28 },
      { whiteKeyId: 30, blackKeyId: 29 },
      { whiteKeyId: 32, blackKeyId: 31 },
      { whiteKeyId: 33 },
      { whiteKeyId: 35, blackKeyId: 34 },
      { whiteKeyId: 37, blackKeyId: 36 },
      { whiteKeyId: 39, blackKeyId: 38 },
      { whiteKeyId: 40 },
      { whiteKeyId: 42, blackKeyId: 41 },
      { whiteKeyId: 44, blackKeyId: 43 },
      { whiteKeyId: 45 },
      { whiteKeyId: 47, blackKeyId: 46 },
      { whiteKeyId: 49, blackKeyId: 48 },
      { whiteKeyId: 51, blackKeyId: 50 },
      { whiteKeyId: 52 },
      { whiteKeyId: 54, blackKeyId: 53 },
      { whiteKeyId: 56, blackKeyId: 55 },
      { whiteKeyId: 57 },
      { whiteKeyId: 59, blackKeyId: 58 },
      { whiteKeyId: 61, blackKeyId: 60 },
      { whiteKeyId: 63, blackKeyId: 62 },
      { whiteKeyId: 64 },
    ];

    // build fullNotes array
    const base = [
      'C',
      'Cs',
      'D',
      'Ds',
      'E',
      'F',
      'Fs',
      'G',
      'Gs',
      'A',
      'As',
      'B',
    ];
    // C2..B2
    base.forEach((n) => this.fullNotes.push(`${n}2`));
    // octaves 3..5
    for (let o = 3; o <= 5; o++)
      base.forEach((n) => this.fullNotes.push(`${n}${o}`));
    // C6 final
    this.fullNotes.push('C6');

    // flatten pianoKeys then sort by keyId to preserve chromatic order
    const flatKeys: number[] = this.pianoKeys
      .flatMap(k => [k.whiteKeyId, k.blackKeyId].filter((x): x is number => x !== undefined))
      .sort((a, b) => a - b);

    // assign each key in sequence its note index
    flatKeys.forEach((keyId, idx) => {
      this.noteToKeyIds.set(idx, [keyId]);
      this.keyIdToNoteIndex.set(keyId, idx);
    });

    // validation: black keys must correspond to sharps
    this.pianoKeys.forEach(k => {
      if (k.blackKeyId !== undefined) {
        const idx = this.keyIdToNoteIndex.get(k.blackKeyId!);
        const note = idx !== undefined ? this.fullNotes[idx] : undefined;
        if (!note || !note.includes('s')) {
          console.warn(`Black key ${k.blackKeyId} mapped to non-sharp note ${note}`);
        }
      }
    });
  }

  ngOnInit() {
    // Always use AZERTY keyboard layout
    this.keyboardMap = this.azertyMap;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (this.keyboardMap.hasOwnProperty(key)) {
      event.preventDefault();
      this.startNoteByIndex(this.keyboardMap[key]);
    }
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (this.keyboardMap.hasOwnProperty(key)) {
      this.stopNoteByIndex(this.keyboardMap[key]);
    }
  }

  keyPress(keyNumber: number) {
    const noteIndex = this.keyIdToNoteIndex.get(keyNumber);
    if (noteIndex === undefined) return;
    this.startNoteByIndex(noteIndex);
  }

  keyRelease(keyNumber: number) {
    const noteIndex = this.keyIdToNoteIndex.get(keyNumber);
    if (noteIndex === undefined) return;
    this.stopNoteByIndex(noteIndex);
  }

  ngOnDestroy(): void {
    this.noteState.reset();
  }

  private async startNoteByIndex(noteIndex: number) {
    const note = this.fullNotes[noteIndex];
    const keyIds = this.noteToKeyIds.get(noteIndex) || [];
    this.stopAudio(noteIndex);
    keyIds.forEach((keyId) => this.highlightedKeyIds.add(keyId));
    this.noteState.press(noteIndex);

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

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

  private stopNoteByIndex(noteIndex: number, fadeTime = 0.15) {
    const keyIds = this.noteToKeyIds.get(noteIndex) || [];
    keyIds.forEach((keyId) => this.highlightedKeyIds.delete(keyId));
    this.noteState.release(noteIndex);
    this.stopAudio(noteIndex, fadeTime);
  }

  private stopAudio(noteIndex: number, fadeTime = 0) {
    const nodes = this.activeNodes.get(noteIndex);
    if (nodes) {
      const { source, gain } = nodes;
      const now = this.audioContext.currentTime;
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + fadeTime);
      source.stop(now + fadeTime);
      this.activeNodes.delete(noteIndex);
    }
  }
}
