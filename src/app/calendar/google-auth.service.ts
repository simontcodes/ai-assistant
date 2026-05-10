import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { environment } from '../../environments/environment';
import {
  GOOGLE_AUTH_SESSION_STORAGE_KEY,
  GOOGLE_CALENDAR_READONLY_SCOPE,
  GOOGLE_WEB_CLIENT_ID_STORAGE_KEY,
} from '../shared/constants/google-auth-config';

type CapgoGoogleState = {
  accessToken?: string;
  idToken?: string;
};

type GoogleIdTokenPayload = {
  email?: string;
  name?: string;
  picture?: string;
  exp?: number;
};

export interface GoogleCalendarAuthSession {
  accessToken: string;
  accessTokenExpiresAt?: string;
  email?: string;
  name?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private readonly pluginGoogleStateKey = 'capgo_social_login_google_state';
  private readonly pluginPendingOAuthStateKey = 'social_login_oauth_pending';
  private initializedClientId: string | null = null;
  private readonly sessionSubject = new BehaviorSubject<GoogleCalendarAuthSession | null>(this.loadSession());

  readonly session$ = this.sessionSubject.asObservable();

  recoverRedirectSessionFromUrl(): GoogleCalendarAuthSession | null {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const idToken = params.get('id_token');

    if (!accessToken) {
      return this.getSession();
    }

    const profile = idToken ? this.parseJwt<GoogleIdTokenPayload>(idToken) : {};
    const session: GoogleCalendarAuthSession = {
      accessToken,
      accessTokenExpiresAt: profile.exp ? new Date(profile.exp * 1000).toISOString() : undefined,
      email: profile.email,
      name: profile.name,
      imageUrl: profile.picture,
    };

    this.saveSession(session);
    localStorage.setItem(this.pluginGoogleStateKey, JSON.stringify({ accessToken, idToken }));
    localStorage.removeItem(this.pluginPendingOAuthStateKey);
    this.removeOAuthHashFromUrl();

    return session;
  }

  getSession(): GoogleCalendarAuthSession | null {
    if (!this.sessionSubject.value) {
      const recoveredSession = this.recoverPluginSession();
      if (recoveredSession) {
        this.saveSession(recoveredSession);
      }
    }

    return this.sessionSubject.value;
  }

  getWebClientId(): string {
    return environment.google.webClientId || localStorage.getItem(GOOGLE_WEB_CLIENT_ID_STORAGE_KEY) || '';
  }

  saveWebClientId(clientId: string): void {
    const trimmedClientId = clientId.trim();

    if (trimmedClientId) {
      localStorage.setItem(GOOGLE_WEB_CLIENT_ID_STORAGE_KEY, trimmedClientId);
    } else {
      localStorage.removeItem(GOOGLE_WEB_CLIENT_ID_STORAGE_KEY);
    }

    this.initializedClientId = null;
  }

  async signIn(): Promise<GoogleCalendarAuthSession> {
    await this.initialize();

    const result = await SocialLogin.login({
      provider: 'google',
      options: {
        scopes: ['profile', 'email', GOOGLE_CALENDAR_READONLY_SCOPE],
        style: 'standard',
        filterByAuthorizedAccounts: false,
      },
    });

    if (result.result.responseType !== 'online' || !result.result.accessToken?.token) {
      throw new Error('Google sign-in did not return an access token.');
    }

    const session: GoogleCalendarAuthSession = {
      accessToken: result.result.accessToken.token,
      accessTokenExpiresAt: result.result.accessToken.expires,
      email: result.result.profile.email ?? undefined,
      name: result.result.profile.name ?? undefined,
      imageUrl: result.result.profile.imageUrl ?? undefined,
    };

    this.saveSession(session);
    return session;
  }

  async signOut(): Promise<void> {
    if (this.initializedClientId || this.getWebClientId()) {
      try {
        await this.initialize();
        await SocialLogin.logout({ provider: 'google' });
      } catch (error) {
        console.warn('Google logout failed. Clearing local session only.', error);
      }
    }

    localStorage.removeItem(GOOGLE_AUTH_SESSION_STORAGE_KEY);
    localStorage.removeItem(this.pluginGoogleStateKey);
    localStorage.removeItem(this.pluginPendingOAuthStateKey);
    this.sessionSubject.next(null);
  }

  clearLocalSession(): void {
    localStorage.removeItem(GOOGLE_AUTH_SESSION_STORAGE_KEY);
    localStorage.removeItem(this.pluginGoogleStateKey);
    localStorage.removeItem(this.pluginPendingOAuthStateKey);
    this.sessionSubject.next(null);
  }

  private async initialize(): Promise<void> {
    const webClientId = this.getWebClientId();
    if (!webClientId) {
      throw new Error('Add a Google Web Client ID before connecting Google Calendar.');
    }

    if (this.initializedClientId === webClientId) {
      return;
    }

    await SocialLogin.initialize({
      google: {
        webClientId,
        mode: 'online',
      },
    });

    this.initializedClientId = webClientId;
  }

  private loadSession(): GoogleCalendarAuthSession | null {
    const raw = localStorage.getItem(GOOGLE_AUTH_SESSION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as GoogleCalendarAuthSession;
      return parsed.accessToken ? parsed : null;
    } catch {
      return null;
    }
  }

  private saveSession(session: GoogleCalendarAuthSession): void {
    localStorage.setItem(GOOGLE_AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private recoverPluginSession(): GoogleCalendarAuthSession | null {
    const raw = localStorage.getItem(this.pluginGoogleStateKey);
    if (!raw) {
      return null;
    }

    try {
      const state = JSON.parse(raw) as CapgoGoogleState;
      if (!state.accessToken) {
        return null;
      }

      const profile = state.idToken ? this.parseJwt<GoogleIdTokenPayload>(state.idToken) : {};

      return {
        accessToken: state.accessToken,
        accessTokenExpiresAt: profile.exp ? new Date(profile.exp * 1000).toISOString() : undefined,
        email: profile.email,
        name: profile.name,
        imageUrl: profile.picture,
      };
    } catch {
      return null;
    }
  }

  private parseJwt<T>(token: string): T {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((character) => `%${(`00${character.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    );

    return JSON.parse(jsonPayload) as T;
  }

  private removeOAuthHashFromUrl(): void {
    if (!window.location.hash.includes('access_token')) {
      return;
    }

    const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }
}
