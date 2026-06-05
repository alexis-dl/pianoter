import { Component } from '@angular/core';
import { KeyboardComponent } from '../keyboard/keyboard.component';

@Component({
  selector: 'app-piano',
  standalone: true,
  imports: [KeyboardComponent],
  template: '<app-keyboard></app-keyboard>',
})
export class PianoComponent {}
