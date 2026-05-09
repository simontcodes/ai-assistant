import { Component } from '@angular/core';
import { UserPreferences } from '../shared/models/domain.models';
import { PreferencesService } from './preferences.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false,
})
export class SettingsPage {
  preferences: UserPreferences;

  constructor(private readonly preferencesService: PreferencesService) {
    this.preferences = { ...this.preferencesService.getPreferences() };
  }

  save(): void {
    this.preferencesService.updatePreferences(this.preferences);
  }
}
