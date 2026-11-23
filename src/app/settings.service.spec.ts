import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

const KEYS = ['notationSystem', 'language', 'keyboardSize'];

describe('SettingsService', () => {
  const clear = () => KEYS.forEach(key => localStorage.removeItem(key));
  beforeEach(clear);
  afterEach(clear);

  const create = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(SettingsService);
  };

  it('starts with Do Ré Mi, French and 3 octaves', () => {
    const settings = create();
    expect(settings.notation).toBe('latin');
    expect(settings.language).toBe('fr');
    expect(settings.keyboardSize).toBe(3);
  });

  it('keeps the choices for the next visit', () => {
    const settings = create();
    settings.setNotation('anglo');
    settings.setLanguage('en');
    settings.setKeyboardSize(1);
    const next = create();
    expect(next.notation).toBe('anglo');
    expect(next.language).toBe('en');
    expect(next.keyboardSize).toBe(1);
  });

  it('ignores stored values it does not know', () => {
    localStorage.setItem('notationSystem', 'solfege');
    localStorage.setItem('language', 'de');
    localStorage.setItem('keyboardSize', '7');
    const settings = create();
    expect(settings.notation).toBe('latin');
    expect(settings.language).toBe('fr');
    expect(settings.keyboardSize).toBe(3);
  });
});
