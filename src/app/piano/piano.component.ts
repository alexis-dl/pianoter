import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { KeyboardComponent } from '../keyboard/keyboard.component';
import { SettingsService } from '../settings.service';

@Component({
    selector: 'app-piano',
    imports: [KeyboardComponent, AsyncPipe],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: '<app-keyboard [size]="(settings.keyboardSize$ | async) ?? 3"></app-keyboard>'
})
export class PianoComponent {
  protected settings = inject(SettingsService);
}
