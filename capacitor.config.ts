/// <reference types="@capacitor/local-notifications" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vlu.digiwell',
  appName: 'DigiWell',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#06B6D4',
    },
  },
};

export default config;
