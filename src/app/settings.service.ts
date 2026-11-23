import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { storage } from './storage';

export type NotationSystem = 'latin' | 'anglo';
export type Language = 'fr' | 'en';
export type KeyboardSize = 1 | 2 | 3 | 4;

const NOTATIONS: NotationSystem[] = ['latin', 'anglo'];
const LANGUAGES: Language[] = ['fr', 'en'];
const KEYBOARD_SIZES: KeyboardSize[] = [1, 2, 3, 4];

/**
 * A stored setting, if it is one of the known values: an old or damaged
 * value (keyboard size 7...) would break the app.
 */
function stored<T>(key: string, allowed: readonly T[], fallback: T): T {
  const raw = storage.get(key);
  const value = allowed.find(option => String(option) === raw);
  return value ?? fallback;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly _notation$ = new BehaviorSubject<NotationSystem>(
    stored('notationSystem', NOTATIONS, 'latin')
  );
  readonly notation$ = this._notation$.asObservable();

  private readonly _language$ = new BehaviorSubject<Language>(
    stored('language', LANGUAGES, 'fr')
  );
  readonly language$ = this._language$.asObservable();

  private readonly _keyboardSize$ = new BehaviorSubject<KeyboardSize>(
    stored('keyboardSize', KEYBOARD_SIZES, 3)
  );
  readonly keyboardSize$ = this._keyboardSize$.asObservable();

  get notation(): NotationSystem {
    return this._notation$.value;
  }

  get language(): Language {
    return this._language$.value;
  }

  get keyboardSize(): KeyboardSize {
    return this._keyboardSize$.value;
  }

  setNotation(system: NotationSystem): void {
    storage.set('notationSystem', system);
    this._notation$.next(system);
  }

  setLanguage(lang: Language): void {
    storage.set('language', lang);
    this._language$.next(lang);
  }

  setKeyboardSize(size: KeyboardSize): void {
    storage.set('keyboardSize', String(size));
    this._keyboardSize$.next(size);
  }
}
