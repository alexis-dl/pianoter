import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  PianoAudioService,
  PlayingNote,
} from '../audio/piano-audio.service';
import { KeyboardComponent } from './keyboard.component';

/** Audio whose samples load when the test decides. */
class FakeAudio {
  readonly played: string[] = [];
  readonly stopped: string[] = [];
  /** Like the real service: one loading per note, shared by all presses. */
  private readonly loads = new Map<
    string,
    { promise: Promise<AudioBuffer | null>; resolve: (b: AudioBuffer) => void }
  >();

  load(note: string): Promise<AudioBuffer | null> {
    if (!this.loads.has(note)) {
      let resolve!: (buffer: AudioBuffer) => void;
      const promise = new Promise<AudioBuffer | null>(r => (resolve = r));
      this.loads.set(note, { promise, resolve });
    }
    return this.loads.get(note)!.promise;
  }

  async finishLoading(note: string): Promise<void> {
    const load = this.loads.get(note);
    load?.resolve({ note } as unknown as AudioBuffer);
    await load?.promise;
    await Promise.resolve(); // let the keyboard's await resume
  }

  play(buffer: AudioBuffer): PlayingNote {
    const note = (buffer as unknown as { note: string }).note;
    this.played.push(note);
    return { stop: () => this.stopped.push(note) };
  }
}

describe('KeyboardComponent', () => {
  let component: KeyboardComponent;
  let fixture: ComponentFixture<KeyboardComponent>;
  let audio: FakeAudio;

  beforeEach(async () => {
    audio = new FakeAudio();
    await TestBed.configureTestingModule({
      imports: [KeyboardComponent],
      providers: [{ provide: PianoAudioService, useValue: audio }],
    }).compileComponents();

    fixture = TestBed.createComponent(KeyboardComponent);
    component = fixture.componentInstance;
    component.size = 1; // C4 to C5: key 0 is C4
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('plays a note once its sample is loaded', async () => {
    component.keyPress(0);
    await audio.finishLoading('C4');
    expect(audio.played).toEqual(['C4']);
    component.keyRelease(0);
    expect(audio.stopped).toEqual(['C4']);
  });

  it('does not play a note released before its sample was loaded', async () => {
    component.keyPress(0);
    component.keyRelease(0);
    await audio.finishLoading('C4');
    expect(audio.played).toEqual([]);
    expect(component.highlightedKeyIds.size).toBe(0);
  });

  it('plays only the last press when a key is pressed again while loading', async () => {
    component.keyPress(0);
    component.keyRelease(0);
    component.keyPress(0);
    await audio.finishLoading('C4');
    // both presses wait for the same sample: only the held one sounds
    expect(audio.played).toEqual(['C4']);
  });

  it('stops the notes when the keyboard is destroyed', async () => {
    component.keyPress(0);
    await audio.finishLoading('C4');
    fixture.destroy();
    expect(audio.stopped).toEqual(['C4']);
  });
});
