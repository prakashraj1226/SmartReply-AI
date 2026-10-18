import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartreplyai.app',
  appName: 'SmartReply AI',
  webDir: 'dist/frontend/browser',
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
