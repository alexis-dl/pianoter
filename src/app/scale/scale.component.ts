import { Component, HostListener, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { ScaleService, ScaleType } from './scale.service';
import { SettingsService } from '../settings.service';
import { TranslatePipe } from '../translate.pipe';
import { KeyboardComponent } from '../keyboard/keyboard.component';
import { noteName, rootSpelling, spellScale } from '../music/music-theory';

@Component({
    selector: 'app-scale',
    imports: [AsyncPipe, TranslatePipe, KeyboardComponent],
    templateUrl: './scale.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./scale.component.scss']
})
export class ScaleComponent {
  private scaleService = inject(ScaleService);
  private settings = inject(SettingsService);

  protected root$ = this.scaleService.root$;
  protected type$ = this.scaleService.type$;

  /** Names of the 12 possible roots, as usually written for this type. */
  protected rootNames$ = combineLatest([this.type$, this.settings.notation$]).pipe(
    map(([type, notation]) =>
      Array.from({ length: 12 }, (_, root) =>
        noteName(rootSpelling(root, type !== 'major'), notation)
      )
    )
  );

  protected rootLabel$ = combineLatest([this.root$, this.rootNames$]).pipe(
    map(([root, names]) => (root === null ? null : names[root]))
  );

  /** The notes of the scale, one per letter (F major: ... B♭ ...). */
  protected scaleNotes$ = combineLatest([
    this.root$,
    this.type$,
    this.settings.notation$,
  ]).pipe(
    map(([root, type, notation]) =>
      root === null
        ? []
        : spellScale(root, type).map(spelling => noteName(spelling, notation))
    )
  );

  protected noteIndices = Array.from({ length: 12 }, (_, i) => i);

  protected readonly scaleTypes: { value: ScaleType; labelKey: string }[] = [
    { value: 'major', labelKey: 'scale.type.major' },
    { value: 'minor', labelKey: 'scale.type.minor' },
    { value: 'harmonic-minor', labelKey: 'scale.type.harmonic-minor' },
  ];

  protected rootOpen = false;
  protected typeOpen = false;

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
