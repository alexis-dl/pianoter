import { Component, HostListener, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { ScaleService, ScaleType } from './scale.service';
import { SettingsService } from '../settings.service';
import { TranslatePipe } from '../translate.pipe';
import { KeyboardComponent } from '../keyboard/keyboard.component';

const NOTES_LATIN = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const NOTES_ANGLO = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

@Component({
  selector: 'app-scale',
  standalone: true,
  imports: [AsyncPipe, TranslatePipe, KeyboardComponent],
  templateUrl: './scale.component.html',
  styleUrls: ['./scale.component.scss'],
})
export class ScaleComponent {
  private scaleService = inject(ScaleService);
  private settings = inject(SettingsService);

  protected root$ = this.scaleService.root$;
  protected type$ = this.scaleService.type$;

  protected rootLabel$ = combineLatest([this.scaleService.root$, this.settings.notation$]).pipe(
    map(([root, notation]) => {
      if (root === null) return null;
      return (notation === 'anglo' ? NOTES_ANGLO : NOTES_LATIN)[root];
    })
  );

  protected noteIndices = Array.from({ length: 12 }, (_, i) => i);

  protected readonly scaleTypes: { value: ScaleType; labelKey: string }[] = [
    { value: 'major',          labelKey: 'scale.type.major' },
    { value: 'minor',          labelKey: 'scale.type.minor' },
    { value: 'harmonic-minor', labelKey: 'scale.type.harmonicMinor' },
  ];

  protected rootOpen = false;
  protected typeOpen = false;

  notation$ = this.settings.notation$;

  noteName(index: number, notation: string): string {
    return (notation === 'anglo' ? NOTES_ANGLO : NOTES_LATIN)[index];
  }

  setRoot(root: number | null): void {
    this.scaleService.setRoot(root);
    this.rootOpen = false;
  }

  setType(type: ScaleType): void {
    this.scaleService.setType(type);
    this.typeOpen = false;
  }

  toggleRoot(event: Event): void {
    event.stopPropagation();
    this.rootOpen = !this.rootOpen;
    this.typeOpen = false;
  }

  toggleType(event: Event): void {
    event.stopPropagation();
    this.typeOpen = !this.typeOpen;
    this.rootOpen = false;
  }

  @HostListener('document:click')
  closeAll(): void {
    this.rootOpen = false;
    this.typeOpen = false;
  }
}
