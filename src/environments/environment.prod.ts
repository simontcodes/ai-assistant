export const environment = {
  production: true,
  openAi: {
    enabled: false,
    apiKey: '',
    model: 'gpt-4o-mini',
  },
  google: {
    // Configure this at build time. Regular users should only see "Connect Google Calendar".
    webClientId: '',
  },
  backend: {
    apiBaseUrl: '',
    androidApiBaseUrl: '',
  },
};
