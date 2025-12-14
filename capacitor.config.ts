import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4d46b2289a2e469ca936ed0640338b2f',
  appName: 'roomylb',
  webDir: 'dist',
  server: {
    url: 'https://4d46b228-9a2e-469c-a936-ed0640338b2f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0B0E1A',
      showSpinner: false,
    },
  },
};

export default config;
