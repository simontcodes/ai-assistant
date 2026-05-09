import { Injectable } from '@angular/core';
import { KnownLocation } from '../shared/models/domain.models';
import { PreferencesService } from '../settings/preferences.service';

@Injectable({
  providedIn: 'root',
})
export class KnownLocationService {
  constructor(private readonly preferencesService: PreferencesService) {}

  getKnownLocations(): KnownLocation[] {
    return this.preferencesService.getKnownLocations();
  }
}
