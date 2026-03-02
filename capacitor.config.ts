import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shadowmint.app',
  appName: 'ShadowMint',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'isdiomwcqcfefebzudpd.supabase.co',
      'api.frankfurter.app',
      'api.coingecko.com',
      'onesignal.com',
    ],
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#020617',
  },
  ios: {
    backgroundColor: '#020617',
    contentInset: 'always',
    scrollEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#020617',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;