import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { KeyboardComponent } from '../keyboard/keyboard.component';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-piano',
  standalone: true,
  imports: [KeyboardComponent, AsyncPipe],
  template: '<app-keyboard [size]="(settings.keyboardSize$ | async) ?? 3"></app-keyboard>',
})
export class PianoComponent {
  protected settings = inject(SettingsService);
}
