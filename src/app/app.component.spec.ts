import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { SettingsService } from './settings.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem('language');
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => localStorage.removeItem('language'));

  const render = () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  };

  it('shows the title and the subtitle', () => {
    const { page } = render();
    expect(page.querySelector('h1')?.textContent).toContain('Pianoter');
    expect(page.querySelector('.app-subtitle')?.textContent).toContain(
      'Piano virtuel'
    );
  });

  it('links to the four pages', () => {
    const { page } = render();
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

  it('translates the menu when the language changes', () => {
    const { fixture, page } = render();
    TestBed.inject(SettingsService).setLanguage('en');
    fixture.detectChanges();
    expect(page.querySelectorAll('nav a')[1].textContent?.trim()).toBe('Learn');
  });

  it('has no nested html, head or body (it used to)', () => {
    const { page } = render();
    expect(page.querySelector('html, head, body')).toBeNull();
  });
});
