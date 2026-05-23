import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xessia.softwarejessica',
  appName: 'XESSIA',
  webDir: 'dist',
  server: {
    url: 'https://software-jessica-production.up.railway.app',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#F8FAFC',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  },
};

export default config;
