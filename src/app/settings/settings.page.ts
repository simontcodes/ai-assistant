import { Component, OnDestroy, OnInit } from '@angular/core';
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
export class SettingsPage implements OnInit, OnDestroy {
  private savedStateSnapshot = '';
  private saveFeedbackTimer: ReturnType<typeof setTimeout> | undefined;

  preferences: UserPreferences;
  openAiApiKey = '';
  googleSession: GoogleCalendarAuthSession | null;
  googleAuthError = '';
  isConnectingGoogle = false;
  saveState: 'idle' | 'saved' = 'idle';

  constructor(
    private readonly preferencesService: PreferencesService,
    private readonly googleAuthService: GoogleAuthService,
  ) {
    this.preferences = { ...this.preferencesService.getPreferences() };
    this.openAiApiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) ?? '';
    this.googleSession = this.googleAuthService.getSession();
    this.savedStateSnapshot = this.currentSettingsSnapshot();
  }

  ngOnInit(): void {
    this.googleSession = this.googleAuthService.getSession();
  }

  ngOnDestroy(): void {
    if (this.saveFeedbackTimer) {
      clearTimeout(this.saveFeedbackTimer);
    }
  }

  get isGoogleCalendarConfigured(): boolean {
    return Boolean(this.googleAuthService.getWebClientId());
  }

  get googleConnectButtonLabel(): string {
    if (!this.isGoogleCalendarConfigured) {
      return 'Unavailable';
    }

    if (this.isConnectingGoogle) {
      return 'Connecting...';
    }

    return this.googleSession ? 'Reconnect' : 'Connect';
  }

  get hasUnsavedChanges(): boolean {
    return this.currentSettingsSnapshot() !== this.savedStateSnapshot;
  }

  get isShowingSavedFeedback(): boolean {
    return this.saveState === 'saved' && !this.hasUnsavedChanges;
  }

  get saveButtonLabel(): string {
    return this.isShowingSavedFeedback ? 'Saved' : 'Save changes';
  }

  save(): void {
    if (!this.hasUnsavedChanges) {
      return;
    }

    this.preferencesService.updatePreferences(this.preferences);
    const trimmedApiKey = this.openAiApiKey.trim();

    if (trimmedApiKey) {
      localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, trimmedApiKey);
    } else {
      localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
    }

    this.openAiApiKey = trimmedApiKey;
    this.savedStateSnapshot = this.currentSettingsSnapshot();
    this.showSavedFeedback();
  }

  async connectGoogleCalendar(): Promise<void> {
    this.googleAuthError = '';
    this.isConnectingGoogle = true;

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

  private currentSettingsSnapshot(): string {
    return JSON.stringify({
      preferences: {
        ...this.preferences,
        minimumUsefulGapMinutes: Number(this.preferences.minimumUsefulGapMinutes) || 0,
      },
      openAiApiKey: this.openAiApiKey.trim(),
    });
  }

  private showSavedFeedback(): void {
    this.saveState = 'saved';

    if (this.saveFeedbackTimer) {
      clearTimeout(this.saveFeedbackTimer);
    }

    this.saveFeedbackTimer = setTimeout(() => {
      this.saveState = 'idle';
      this.saveFeedbackTimer = undefined;
    }, 1400);
  }
}
