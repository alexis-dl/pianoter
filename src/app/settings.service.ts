import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotationSystem = 'latin' | 'anglo';
export type Language = 'fr' | 'en';
export type KeyboardSize = 1 | 2 | 3 | 4;

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly _notation$ = new BehaviorSubject<NotationSystem>(
    (localStorage.getItem('notationSystem') as NotationSystem) ?? 'latin'
  );
  readonly notation$ = this._notation$.asObservable();

  private readonly _language$ = new BehaviorSubject<Language>(
    (localStorage.getItem('language') as Language) ?? 'fr'
  );
  readonly language$ = this._language$.asObservable();

  get notation(): NotationSystem {
    return this._notation$.value;
  }

  get language(): Language {
    return this._language$.value;
  }

  setNotation(system: NotationSystem): void {
    localStorage.setItem('notationSystem', system);
    this._notation$.next(system);
  }

  private readonly _keyboardSize$ = new BehaviorSubject<KeyboardSize>(
    (Number(localStorage.getItem('keyboardSize')) as KeyboardSize) || 3
  );
  readonly keyboardSize$ = this._keyboardSize$.asObservable();

  get keyboardSize(): KeyboardSize { return this._keyboardSize$.value; }

  setLanguage(lang: Language): void {
    localStorage.setItem('language', lang);
    this._language$.next(lang);
  }

  setKeyboardSize(size: KeyboardSize): void {
    localStorage.setItem('keyboardSize', String(size));
    this._keyboardSize$.next(size);
  }
}
