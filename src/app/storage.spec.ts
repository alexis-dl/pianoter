import { TestBed } from '@angular/core/testing';
import { ScaleService } from './scale/scale.service';
import { SettingsService } from './settings.service';
import { TranslationService } from './translation.service';

/** Some browsers throw on any use of localStorage when it is blocked. */
describe('with localStorage blocked', () => {
  beforeEach(() => {
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    spyOn(Storage.prototype, 'getItem').and.callFake(blocked);
    spyOn(Storage.prototype, 'setItem').and.callFake(blocked);
    spyOn(Storage.prototype, 'removeItem').and.callFake(blocked);
    TestBed.configureTestingModule({});
  });

  it('starts with the default settings, and keeps changes for the visit', () => {
    const settings = TestBed.inject(SettingsService);
    expect(settings.language).toBe('fr');
    settings.setLanguage('en');
    settings.setKeyboardSize(2);
    expect(settings.language).toBe('en');
    expect(settings.keyboardSize).toBe(2);
    expect(TestBed.inject(TranslationService).t('nav.learn')).toBe('Learn');
  });

  it('lets the user choose a scale', () => {
    const scales = TestBed.inject(ScaleService);
    scales.setRoot(5);
    scales.setRoot(null);
    scales.setType('minor');
    expect(scales.type).toBe('minor');
  });
});
