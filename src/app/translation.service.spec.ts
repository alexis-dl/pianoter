import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('language');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TranslationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('language');
  });

  it('translates with the loaded language, and shows the key otherwise', () => {
    service.load('fr').subscribe();
    http.expectOne('assets/i18n/fr.json').flush({ 'nav.learn': 'Apprendre' });
    expect(service.t('nav.learn')).toBe('Apprendre');
    expect(service.t('nav.unknown')).toBe('nav.unknown');
  });

  it('loads the other language when the setting changes', () => {
    service.load('fr').subscribe();
    http.expectOne('assets/i18n/fr.json').flush({ 'nav.learn': 'Apprendre' });

    TestBed.inject(SettingsService).setLanguage('en');
    http.expectOne('assets/i18n/en.json').flush({ 'nav.learn': 'Learn' });
    expect(service.t('nav.learn')).toBe('Learn');
  });
});
