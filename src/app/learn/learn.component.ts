import { Component, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { KeyboardComponent } from '../keyboard/keyboard.component';
import { NoteStateService } from '../note-state.service';

@Component({
  selector: 'app-learn',
  standalone: true,
  imports: [KeyboardComponent, AsyncPipe, NgFor, NgIf],
  templateUrl: './learn.component.html',
  styleUrls: ['./learn.component.scss'],
})
export class LearnComponent {
  protected display$ = inject(NoteStateService).display$;
}
