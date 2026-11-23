import en from '../assets/i18n/en.json';
import fr from '../assets/i18n/fr.json';

/** The translation files, loaded at run time, must stay in step. */
describe('translations', () => {
  const files: Record<string, Record<string, string>> = { fr, en };

  it('has the same keys in every language', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
  });

  for (const [language, texts] of Object.entries(files)) {
    it(`has no empty text in ${language}`, () => {
      for (const [key, text] of Object.entries(texts)) {
        expect(text.trim()).withContext(`${language}: ${key}`).not.toBe('');
      }
    });
  }
});
