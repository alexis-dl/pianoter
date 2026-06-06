import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, skip, switchMap, tap } from 'rxjs/operators';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private translations: Record<string, string> = {};
  private readonly _changes$ = new BehaviorSubject<void>(undefined);
  readonly changes$ = this._changes$.asObservable();

  constructor(private http: HttpClient, private settings: SettingsService) {
    this.settings.language$.pipe(
      skip(1),
      switchMap(lang => this.load(lang))
    ).subscribe();
  }

  load(lang: string): Observable<void> {
    return this.http.get<Record<string, string>>(`assets/i18n/${lang}.json`).pipe(
      tap(data => {
        this.translations = data;
        this._changes$.next();
      }),
      map(() => undefined)
    );
  }

  t(key: string): string {
    return this.translations[key] ?? key;
  }
}
