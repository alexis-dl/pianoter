import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { SCALE_INTERVALS, ScaleType } from '../music/music-theory';
import { storage } from '../storage';

export type { ScaleType };

/** Stored root: a pitch class from 0 (C) to 11 (B), else none. */
function storedRoot(): number | null {
  const raw = storage.get('scaleRoot');
  const root = raw === null ? NaN : Number(raw);
  return Number.isInteger(root) && root >= 0 && root < 12 ? root : null;
}

/** Stored type, if known: an unknown one would break the scale's notes. */
function storedType(): ScaleType {
  const raw = storage.get('scaleType');
  return raw !== null && raw in SCALE_INTERVALS ? (raw as ScaleType) : 'major';
}

@Injectable({ providedIn: 'root' })
export class ScaleService {
  private readonly _root$ = new BehaviorSubject<number | null>(storedRoot());
  private readonly _type$ = new BehaviorSubject<ScaleType>(storedType());

  readonly root$ = this._root$.asObservable();
  readonly type$ = this._type$.asObservable();

  readonly activePitchClasses$ = combineLatest([this._root$, this._type$]).pipe(
    map(([root, type]) => {
      if (root === null) return null;
      return new Set(SCALE_INTERVALS[type].map(i => (root + i) % 12));
    })
  );

  get root(): number | null { return this._root$.value; }
  get type(): ScaleType { return this._type$.value; }

  setRoot(root: number | null): void {
    root === null
      ? storage.remove('scaleRoot')
      : storage.set('scaleRoot', String(root));
    this._root$.next(root);
  }

  setType(type: ScaleType): void {
    storage.set('scaleType', type);
    this._type$.next(type);
  }
}
