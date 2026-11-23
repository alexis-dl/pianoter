import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  const create = () => {
    TestBed.configureTestingModule({});
    return TestBed.inject(TranslationService);
  };

  beforeEach(() => localStorage.removeItem('language'));
  afterEach(() => localStorage.removeItem('language'));

  it('translates at once, with no download', () => {
    expect(create().t('nav.learn')).toBe('Apprendre');
  });

  it('shows the key of a missing text', () => {
    expect(create().t('nav.unknown')).toBe('nav.unknown');
  });

  it('follows the language setting, and sets the page language', () => {
    const service = create();
    TestBed.inject(SettingsService).setLanguage('en');
    expect(service.t('nav.learn')).toBe('Learn');
    expect(document.documentElement.lang).toBe('en');
  });
});
