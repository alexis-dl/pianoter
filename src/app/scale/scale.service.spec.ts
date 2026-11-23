import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ScaleService } from './scale.service';

const C = 0;
const D = 2;
const A = 9;

describe('ScaleService', () => {
  const clear = () => {
    localStorage.removeItem('scaleRoot');
    localStorage.removeItem('scaleType');
  };
  beforeEach(clear);
  afterEach(clear);

  const create = () => {
    TestBed.configureTestingModule({});
    return TestBed.inject(ScaleService);
  };
  const notesOf = async (service: ScaleService) => {
    const notes = await firstValueFrom(service.activePitchClasses$);
    return notes ? [...notes].sort((a, b) => a - b) : null;
  };

  it('has no scale until a root is chosen, major by default', async () => {
    const service = create();
    expect(service.root).toBeNull();
    expect(service.type).toBe('major');
    expect(await notesOf(service)).toBeNull();
  });

  it('gives the notes of C major: the white keys', async () => {
    const service = create();
    service.setRoot(C);
    expect(await notesOf(service)).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('gives the notes of D major: F# and C#', async () => {
    const service = create();
    service.setRoot(D);
    // D E F# G A B C#
    expect(await notesOf(service)).toEqual([1, 2, 4, 6, 7, 9, 11]);
  });

  it('gives A minor (the white keys) and A harmonic minor (G#)', async () => {
    const service = create();
    service.setRoot(A);
    service.setType('minor');
    expect(await notesOf(service)).toEqual([0, 2, 4, 5, 7, 9, 11]);
    service.setType('harmonic-minor');
    // A B C D E F G#
    expect(await notesOf(service)).toEqual([0, 2, 4, 5, 8, 9, 11]);
  });

  it('ignores a stored root or type it does not know', async () => {
    localStorage.setItem('scaleType', 'dorian');
    for (const root of ['15', '-1', 'abc', '2.5']) {
      localStorage.setItem('scaleRoot', root);
      TestBed.resetTestingModule();
      const service = create();
      expect(service.root).withContext(root).toBeNull();
      expect(service.type).toBe('major');
      expect(await notesOf(service)).toBeNull();
    }
  });

  it('keeps the choice for the next visit, and forgets a removed root', () => {
    create().setRoot(D);
    TestBed.inject(ScaleService).setType('minor');
    TestBed.resetTestingModule();
    const next = create();
    expect(next.root).toBe(D);
    expect(next.type).toBe('minor');
    next.setRoot(null);
    expect(localStorage.getItem('scaleRoot')).toBeNull();
  });
});
