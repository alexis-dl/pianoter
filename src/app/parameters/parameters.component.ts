import { Component, HostListener, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { SettingsService, NotationSystem, Language, KeyboardSize } from '../settings.service';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-parameters',
  standalone: true,
  imports: [AsyncPipe, TranslatePipe],
  templateUrl: './parameters.component.html',
  styleUrls: ['./parameters.component.scss'],
})
export class ParametersComponent {
  protected settings = inject(SettingsService);
  protected notation$ = this.settings.notation$;
  protected language$ = this.settings.language$;
  protected keyboardSize$ = this.settings.keyboardSize$;

  readonly keySizes: { value: KeyboardSize; labelKey: string }[] = [
    { value: 1, labelKey: 'settings.keyboardSize.1' },
    { value: 2, labelKey: 'settings.keyboardSize.2' },
    { value: 3, labelKey: 'settings.keyboardSize.3' },
    { value: 4, labelKey: 'settings.keyboardSize.4' },
  ];
  protected langOpen = false;

  readonly languages: { value: Language; labelKey: string }[] = [
    { value: 'fr', labelKey: 'settings.language.fr' },
    { value: 'en', labelKey: 'settings.language.en' },
  ];

  setKeyboardSize(size: KeyboardSize): void {
    this.settings.setKeyboardSize(size);
  }

  setNotation(system: NotationSystem): void {
    this.settings.setNotation(system);
  }

  setLanguage(lang: Language): void {
    this.settings.setLanguage(lang);
    this.langOpen = false;
  }

  toggleLang(event: Event): void {
    event.stopPropagation();
    this.langOpen = !this.langOpen;
  }

  @HostListener('document:click')
  closeLang(): void {
    this.langOpen = false;
  }
}
