import { Component, OnInit } from '@angular/core';
import { UserPreferences } from '../shared/models/domain.models';
import { OPENAI_API_KEY_STORAGE_KEY } from '../shared/constants/openai-config';
import { PreferencesService } from './preferences.service';
import { GoogleAuthService, GoogleCalendarAuthSession } from '../calendar/google-auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false,
})
export class SettingsPage implements OnInit {
  preferences: UserPreferences;
  openAiApiKey = '';
  googleWebClientId = '';
  googleSession: GoogleCalendarAuthSession | null;
  googleAuthError = '';
  isConnectingGoogle = false;

  constructor(
    private readonly preferencesService: PreferencesService,
    private readonly googleAuthService: GoogleAuthService,
  ) {
    this.preferences = { ...this.preferencesService.getPreferences() };
    this.openAiApiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) ?? '';
    this.googleWebClientId = this.googleAuthService.getWebClientId();
    this.googleSession = this.googleAuthService.getSession();
  }

  ngOnInit(): void {
    this.googleSession = this.googleAuthService.getSession();
  }

  save(): void {
    this.preferencesService.updatePreferences(this.preferences);
    const trimmedApiKey = this.openAiApiKey.trim();

    if (trimmedApiKey) {
      localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, trimmedApiKey);
    } else {
      localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
    }

    this.googleAuthService.saveWebClientId(this.googleWebClientId);
  }

  async connectGoogleCalendar(): Promise<void> {
    this.googleAuthError = '';
    this.isConnectingGoogle = true;
    this.googleAuthService.saveWebClientId(this.googleWebClientId);

    try {
      this.googleSession = await this.googleAuthService.signIn();
    } catch (error) {
      this.googleAuthError = error instanceof Error ? error.message : 'Google sign-in failed.';
    } finally {
      this.isConnectingGoogle = false;
    }
  }

  async disconnectGoogleCalendar(): Promise<void> {
    this.googleAuthError = '';
    await this.googleAuthService.signOut();
    this.googleSession = null;
  }
}
