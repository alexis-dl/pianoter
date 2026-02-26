import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KeyboardComponent } from './keyboard/keyboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, KeyboardComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'pianoter';
}
