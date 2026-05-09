import { Injectable } from '@angular/core';
import { KnownLocation, UserLocation } from '../shared/models/domain.models';

@Injectable({
  providedIn: 'root',
})
export class TravelTimeService {
  async estimateTravelTimeMinutes(
    _origin: UserLocation,
    destination: Pick<KnownLocation, 'label' | 'name'> | { label?: string; name?: string } | null,
  ): Promise<number | null> {
    if (!destination) {
      return null;
    }

    if (destination.label === 'work') {
      return 10;
    }

    if (destination.label === 'home') {
      return 15;
    }

    return 20;
  }
}
