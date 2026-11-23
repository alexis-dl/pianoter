import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { KeyboardComponent } from '../keyboard/keyboard.component';
import { NoteStateService } from '../note-state.service';
import { SettingsService } from '../settings.service';

@Component({
    selector: 'app-learn',
    imports: [KeyboardComponent, AsyncPipe],
    templateUrl: './learn.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./learn.component.scss']
})
export class LearnComponent {
  protected display$ = inject(NoteStateService).display$;
  protected settings = inject(SettingsService);
}
