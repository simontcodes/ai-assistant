import { Injectable } from '@angular/core';
import { UserLocation } from '../shared/models/domain.models';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  async getCurrentLocation(): Promise<UserLocation> {
    return {
      lat: 49.8951,
      lng: -97.1384,
      accuracyMeters: 500,
      capturedAt: new Date().toISOString(),
    };
  }
}
