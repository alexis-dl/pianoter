import { Routes } from '@angular/router';
import { PianoComponent } from './piano/piano.component';
import { LearnComponent } from './learn/learn.component';
import { ParametersComponent } from './parameters/parameters.component';
import { ScaleComponent } from './scale/scale.component';

export const routes: Routes = [
  { path: '', component: PianoComponent },
  { path: 'learn', component: LearnComponent },
  { path: 'scale', component: ScaleComponent },
  { path: 'settings', component: ParametersComponent },
];