# Pianoter

A virtual piano in the browser, to play and to learn: it names the notes,
intervals and chords you play, and shows the scales on the keyboard.

Live: https://alexis-dl.github.io/pianoter/

## Features

- **Piano**: 1 to 4 octaves of sampled piano (A0–C8 samples, loaded on first
  use). Play with the mouse, the fingers (several at once for chords, slide
  for a glissando) or the computer keyboard (AZERTY layout).
- **Learn**: names what you play — a note, an interval (from the lowest
  note), or a chord in any inversion (major, minor, diminished, augmented,
  7, maj7, m7).
- **Scale**: major, natural minor and harmonic minor scales on any root,
  highlighted on the keyboard and spelled as on a score (F major has B♭,
  G♯ harmonic minor has F♯♯).
- **Settings**: note names (Do Ré Mi or C D E), language (French or
  English), keyboard size. Saved in the browser.

On a phone, the keyboard stays on one row and shows fewer octaves when the
screen is too narrow.

## Development

Angular 22, standalone components, no UI library. Node 22.22+ or 24.

```bash
npm install
npm start          # dev server on http://localhost:4200/
npm run build      # production build in dist/pianoter/browser
npm test           # unit tests (Karma + Jasmine), watch mode
npm run test:ci    # unit tests once, in headless Chrome (as in CI)
```

The tests run on every push and pull request (`.github/workflows/test.yml`).

## Code map

| Path | Role |
|---|---|
| `src/app/keyboard/` | The keyboard: keys, pointer and AZERTY input, octaves that fit the screen |
| `src/app/audio/piano-audio.service.ts` | One `AudioContext` and one cache of samples for the whole app |
| `src/app/music/music-theory.ts` | Scales, intervals, chords and note spelling (pure functions) |
| `src/app/note-state.service.ts` | Notes held, and what they make (Learn page) |
| `src/app/scale/` | Scale page and the chosen scale |
| `src/app/settings.service.ts` | Settings, checked when read back from storage |
| `src/app/translation.service.ts`, `src/app/i18n/` | Texts in French and English, built into the app |
| `src/assets/sounds/piano-sounds/` | Piano samples, one MP3 per note (`C4.mp3`, `Fs3.mp3`...) |

## Deployment

Pianoter is a submodule of the portfolio site, which builds it with
`--base-href /pianoter/` and publishes it on GitHub Pages. A push to
`master` notifies the portfolio (`.github/workflows/notify-portfolio.yml`),
which redeploys the site.
