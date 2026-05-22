import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xessia.softwarejessica',
  appName: 'XESSIA Software Jessica',
  webDir: 'dist',
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
