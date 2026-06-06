import { ChangeDetectorRef, inject, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from './translation.service';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform, OnDestroy {
  private ts = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private sub: Subscription;

  constructor() {
    this.sub = this.ts.changes$.subscribe(() => this.cdr.markForCheck());
  }

  transform(key: string): string {
    return this.ts.t(key);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
