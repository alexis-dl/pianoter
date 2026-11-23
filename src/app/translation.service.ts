import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import en from './i18n/en.json';
import fr from './i18n/fr.json';
import { Language, SettingsService } from './settings.service';

/**
 * Texts of the interface. They are part of the app (a few kB): the app
 * starts even when the network fails, with no download before the first
 * screen.
 */
const TRANSLATIONS: Record<Language, Record<string, string>> = { fr, en };

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private translations: Record<string, string> = {};
  /** Emits when the language changes, so that the texts are redrawn. */
  private readonly _changes$ = new BehaviorSubject<void>(undefined);
  readonly changes$ = this._changes$.asObservable();

  constructor(settings: SettingsService) {
    settings.language$.subscribe(language => {
      this.translations = TRANSLATIONS[language];
      // screen readers and the browser's translation read the page's lang
      document.documentElement.lang = language;
      this._changes$.next();
    });
  }

  /** Text of a key in the current language, or the key if it is missing. */
  t(key: string): string {
    return this.translations[key] ?? key;
  }
}
