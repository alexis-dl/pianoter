import { Routes } from '@angular/router';
import { PianoComponent } from './piano/piano.component';
import { LearnComponent } from './learn/learn.component';

export const routes: Routes = [
  { path: '', component: PianoComponent },
  { path: 'apprendre', component: LearnComponent },
];
