# Pianoter - AI Agent Guidelines

## Project Overview

Pianoter is an Angular 22 virtual piano: a keyboard with sampled piano
sounds, a Learn page naming the notes / intervals / chords played, a Scale
page, and settings. See README.md for the features and the code map.

## Code Style

- **Angular 22**, standalone components (no NgModules, no `standalone: true`:
  it is the default), `ChangeDetectionStrategy.Eager`, built-in control flow
  (`@if`, `@for`), `inject()` for dependencies.
- **TypeScript** strict mode. Comments and identifiers in English.
- **SCSS**, one file per component. Budget: 4 kB warning per component style.
- State lives in services exposing `BehaviorSubject` values as observables.

## Architecture

- `keyboard/keyboard.component.ts`: builds the keys for the octaves shown
  (`size` input, capped by the window width), handles pointer events
  (mouse, several fingers, glissando) and the AZERTY keys, highlights scales.
  It does not play sound itself.
- `audio/piano-audio.service.ts`: the only `AudioContext` of the app and the
  cache of samples (`assets/sounds/piano-sounds/<note>.mp3`, e.g. `C4`,
  `Fs3`). Never create another `AudioContext`.
- `music/music-theory.ts`: pure functions for scales, intervals, chords and
  note spelling (letters + accidentals, ♯/♭). Put music logic here, with
  tests, rather than in components.
- `note-state.service.ts`: notes held and their name (Learn page).
- `settings.service.ts` / `scale/scale.service.ts`: settings and the chosen
  scale. Read stored values through `storage.ts` (it never throws) and
  check them against the allowed values.
- `translation.service.ts` + `i18n/fr.json`, `i18n/en.json`: texts built into
  the app. Both files must have the same keys (checked by a test). Interval
  and chord names are in `music-theory.ts`, by language.

## Build and Test

```bash
npm start          # dev server on http://localhost:4200/
npm run build      # production build
npm run test:ci    # all unit tests once, headless Chrome (Karma + Jasmine)
```

Add or update tests (`*.spec.ts`, next to the code) with every change; the
tests run in CI on every push.

## Deployment

Submodule of the portfolio site (GitHub Pages, base href `/pianoter/`).
Asset URLs must stay relative (`assets/...`) so that they work under that
base href.
