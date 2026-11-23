import { Injectable } from '@angular/core';

/** A note being played: stop it with a short fade. */
export interface PlayingNote {
  stop(fadeTime?: number): void;
}

/**
 * Plays the piano samples (assets/sounds/piano-sounds/<note>.mp3). A single
 * AudioContext and a single cache of samples for the whole app: the keyboard
 * is created again on each page, the sounds are not.
 */
@Injectable({ providedIn: 'root' })
export class PianoAudioService {
  private context?: AudioContext;
  /** Samples being loaded or loaded, by note name ('C4', 'Fs3'...). */
  private readonly samples = new Map<string, Promise<AudioBuffer>>();

  /**
   * Load a note's sample (once), so that it can be played.
   * @returns null when it cannot be loaded (network error, no audio).
   */
  async load(note: string): Promise<AudioBuffer | null> {
    const context = this.getContext();
    if (!context) {
      return null;
    }
    let sample = this.samples.get(note);
    if (!sample) {
      sample = fetch(`assets/sounds/piano-sounds/${note}.mp3`)
        .then(response => response.arrayBuffer())
        .then(data => context.decodeAudioData(data));
      this.samples.set(note, sample);
    }
    try {
      return await sample;
    } catch {
      this.samples.delete(note); // try again on the next press
      return null;
    }
  }

  /** Play a loaded sample now. */
  play(buffer: AudioBuffer): PlayingNote | null {
    const context = this.getContext();
    if (!context) {
      return null;
    }
    if (context.state === 'suspended') {
      void context.resume(); // browsers start it suspended until a gesture
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    gain.gain.setValueAtTime(1, context.currentTime);
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
    return {
      stop: (fadeTime = 0) => {
        const now = context.currentTime;
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + fadeTime);
        try {
          source.stop(now + fadeTime);
        } catch {
          // already stopped
        }
      },
    };
  }

  private getContext(): AudioContext | undefined {
    if (!this.context && typeof AudioContext !== 'undefined') {
      this.context = new AudioContext();
    }
    return this.context;
  }
}
