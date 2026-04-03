import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gotgetgo.app',
  appName: 'GotGetGo',
  webDir: 'dist',
  plugins: {
    CapacitorCalendar: {},
  },
};

export default config;
