import en from './i18n/en.json';
import fr from './i18n/fr.json';
import { SCALE_INTERVALS } from './music/music-theory';

/** The translation files, built into the app, must stay in step. */
describe('translations', () => {
  const files: Record<string, Record<string, string>> = { fr, en };

  it('has the same keys in every language', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
  });

  it('names every scale type (the scale page builds these keys)', () => {
    for (const type of Object.keys(SCALE_INTERVALS)) {
      expect(fr[`scale.type.${type}` as keyof typeof fr])
        .withContext(type)
        .toBeTruthy();
    }
  });

  for (const [language, texts] of Object.entries(files)) {
    it(`has no empty text in ${language}`, () => {
      for (const [key, text] of Object.entries(texts)) {
        expect(text.trim()).withContext(`${language}: ${key}`).not.toBe('');
      }
    });
  }
});
