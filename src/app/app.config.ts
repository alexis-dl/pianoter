import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { TranslationService } from './translation.service';
import { SettingsService } from './settings.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: (ts: TranslationService, settings: SettingsService) =>
        () => firstValueFrom(ts.load(settings.language)),
      deps: [TranslationService, SettingsService],
      multi: true,
    },
  ],
};
