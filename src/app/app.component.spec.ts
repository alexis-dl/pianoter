import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { TranslationService } from './translation.service';

describe('AppComponent', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Render the app with the given translations loaded. */
  const render = (translations: Record<string, string>) => {
    TestBed.inject(TranslationService).load('fr').subscribe();
    http.expectOne('assets/i18n/fr.json').flush(translations);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('shows the title and the translated subtitle', () => {
    const page = render({ 'app.subtitle': 'Piano virtuel' });
    expect(page.querySelector('h1')?.textContent).toContain('Pianoter');
    expect(page.querySelector('.app-subtitle')?.textContent).toContain(
      'Piano virtuel'
    );
  });

  it('links to the four pages, with translated labels', () => {
    const page = render({
      'nav.piano': 'Piano',
      'nav.learn': 'Apprendre',
      'nav.scale': 'Gamme',
      'nav.settings': 'Paramètres',
    });
    const links = Array.from(page.querySelectorAll('nav a'));
    expect(links.map(link => link.textContent?.trim())).toEqual([
      'Piano',
      'Apprendre',
      'Gamme',
      'Paramètres',
    ]);
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      '/',
      '/learn',
      '/scale',
      '/settings',
    ]);
  });

  it('shows the key of a missing translation rather than nothing', () => {
    const page = render({});
    expect(page.querySelector('nav a')?.textContent?.trim()).toBe('nav.piano');
  });
});
