# Pianoter Frontend - AI Agent Guidelines

## Project Overview

Pianoter is an Angular 18 piano application featuring a visual keyboard component and a piano note player. The application uses standalone components, strict TypeScript configuration, and Web Audio API for sound playback.

## Code Style

### Angular & TypeScript

- **Framework**: Angular 18 with standalone components (no NgModules)
- **TypeScript**: ES2022 target, strict mode enabled (`noImplicitAny`, `noImplicitReturns`, `strictTemplateTypes`)
- **Naming**: Component files follow pattern `name.component.ts` with corresponding `.html` and `.scss` files
- **Imports**: Use relative imports for local files, barrel exports with `index.ts` when organizing modules

### SCSS Styling

- Style files use SCSS format (`.scss`)
- Keep component styles in `component-name.component.scss` colocated with the component
- Define colors and shared styles as SCSS variables

### Enums & Constants

- Musical notes defined as enums in [src/app/piano/note.enum..ts](src/app/piano/note.enum..ts)
- Use `PIANO_12_NOTES` constant for chromatic scale references

## Architecture

### Component Structure

```
src/app/
├── keyboard/        # Keyboard/UI component with built-in sound playback
│   ├── keyboard.component.ts
│   ├── keyboard.component.html
│   ├── keyboard.component.scss
│   ├── ipiano-key.ts    # Interface for piano keys
│   └── note.enum..ts    # Note definitions
└── app.component.ts # Root component
```

### Sound Emission

**Sound is emitted in [src/app/keyboard/keyboard.component.ts](src/app/keyboard/keyboard.component.ts) via the `playNote()` method:**

- Creates HTML Audio element: `new Audio('assets/sounds/piano-sounds/' + note + '.mp3')`
- Calls `audio.play()` to emit sound
- Sound files stored in `assets/sounds/piano-sounds/` directory with 49 files named from `C2.mp3` through `C6.mp3`

### Component Communication

- `KeyboardComponent` is self-contained and handles both keyboard UI and note playback
- Root `AppComponent` simply composes the keyboard component

## Build and Test

### Development

```bash
npm start          # Start dev server at http://localhost:4200/
npm run build      # Build for production
npm run watch      # Build in watch mode
npm test           # Run unit tests via Karma
```

### Testing Framework

- **Unit Tests**: Karma + Jasmine
- **Test Files**: Located alongside components with `.spec.ts` suffix
- **Configuration**: See `karma.conf.js` for test runner configuration

## Project Conventions

### Component Patterns

1. All components are **standalone** - import only needed dependencies via `imports: [...]`
2. Use `templateUrl` and `styleUrls` (or `styleUrl`) for external templates and styles
3. Implement `OnInit` lifecycle hook when needed for initialization logic

### Type Safety

- Use strict TypeScript with proper type annotations
- Interfaces for structural contracts (e.g., `IPianoKey` extends `{ whiteKeyId: number }`)
- Enums for fixed sets of values (see `Note` enum)

### Audio Handling

- Web Audio API used directly via browser's `Audio` constructor
- No external audio library dependencies
- File paths relative to `assets/` directory in public folder structure

## Integration Points

### External Assets

- Sound files: `src/assets/sounds/` - WAV format audio files
- Build process handles asset copying to `dist/` during build

### Browser APIs Used

- **Web Audio API**: `new Audio()` for sound playback
- **DOM APIs**: Standard Angular template bindings

## Key Files Reference

- **Root Config**: [src/app/app.config.ts](src/app/app.config.ts)
- **Routes**: [src/app/app.routes.ts](src/app/app.routes.ts)
- **Entry Point**: [src/main.ts](src/main.ts)
- **Global Styles**: [src/styles.scss](src/styles.scss)
