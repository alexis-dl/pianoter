import { TestBed } from '@angular/core/testing';
import { NoteDisplay, NoteStateService } from './note-state.service';

// note indices are relative to the first key, a C
const C = 0;
const E = 4;
const G = 7;
const C_UP = 12;
const E_UP = 16;

describe('NoteStateService', () => {
  let service: NoteStateService;
  let display: NoteDisplay;

  beforeEach(() => {
    localStorage.setItem('notationSystem', 'latin');
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoteStateService);
    service.display$.subscribe(value => (display = value));
  });

  afterEach(() => localStorage.removeItem('notationSystem'));

  const play = (...notes: number[]) => {
    service.reset();
    notes.forEach(note => service.press(note));
    return display;
  };

  it('names the interval from the lowest note, whatever the order', () => {
    expect(play(C, E).label).toBe('Tierce majeure');
    expect(play(E, C).label).toBe('Tierce majeure');
  });

  it('names the inverted interval when the lowest note changes', () => {
    // E below the upper C: a minor sixth, pressed in either order
    expect(play(E, C_UP).label).toBe('Sixte mineure');
    expect(play(C_UP, E).label).toBe('Sixte mineure');
  });

  it('reduces compound intervals to the octave', () => {
    expect(play(E_UP, C).label).toBe('Tierce majeure');
  });

  it('lists the notes from low to high', () => {
    expect(play(G, E, C).noteNames).toEqual(['Do', 'Mi', 'Sol']);
  });

  it('recognizes a chord and its inversions', () => {
    expect(play(C, E, G).label).toBe('Do majeur');
    expect(play(E, G, C_UP).label).toBe('Do majeur');
  });

  it('recognizes minor, diminished, augmented and seventh chords', () => {
    expect(play(9, 12, 16).label).toBe('La mineur'); // A C E
    expect(play(11, 14, 17).label).toBe('Si dim.'); // B D F
    expect(play(C, E, 8).label).toBe('Do aug.'); // C E G#
    expect(play(7, 11, 14, 17).label).toBe('Sol 7'); // G B D F
    expect(play(C, E, G, 11).label).toBe('Do maj.7'); // C E G B
    expect(play(2, 5, 9, 12).label).toBe('Ré m7'); // D F A C
  });

  it('names the tritone, and lists notes that make no known chord', () => {
    expect(play(C, 6).label).toBe('Triton');
    expect(play(C, 1, 2).label).toBe('Do + Do# + Ré');
  });

  it('switches to C D E names with the English notation', () => {
    localStorage.setItem('notationSystem', 'anglo');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoteStateService);
    service.display$.subscribe(value => (display = value));
    expect(play(9, 12, 16).label).toBe('A min');
    expect(play(G, 11, 14, 17).noteNames).toEqual(['G', 'B', 'D', 'F']);
  });
});
