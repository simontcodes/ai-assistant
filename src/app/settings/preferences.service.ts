import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { KnownLocation, UserPreferences } from '../shared/models/domain.models';

const STORAGE_KEY = 'ai-day-assistant.preferences.v1';

const DEFAULT_PREFERENCES: UserPreferences = {
  workDayStart: '09:00',
  workDayEnd: '17:00',
  allowPersonalTasksDuringWork: true,
  minimumUsefulGapMinutes: 10,
  homeLocationName: 'Home',
  workLocationName: 'Office',
};

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  private readonly preferencesSubject = new BehaviorSubject<UserPreferences>(this.loadPreferences());

  readonly preferences$ = this.preferencesSubject.asObservable();

  getPreferences(): UserPreferences {
    return this.preferencesSubject.value;
  }

  updatePreferences(update: Partial<UserPreferences>): UserPreferences {
    const next = {
      ...this.preferencesSubject.value,
      ...update,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.preferencesSubject.next(next);
    return next;
  }

  getKnownLocations(): KnownLocation[] {
    const preferences = this.getPreferences();
    return [
      {
        id: 'home',
        label: 'home',
        name: preferences.homeLocationName || 'Home',
      },
      {
        id: 'work',
        label: 'work',
        name: preferences.workLocationName || 'Office',
      },
    ];
  }

  private loadPreferences(): UserPreferences {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    try {
      return {
        ...DEFAULT_PREFERENCES,
        ...JSON.parse(raw),
      } as UserPreferences;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }
}
