import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.klinik.app',
  appName: 'AMC Inventory System',
  webDir: 'out',
  server: {
    androidScheme: 'http',
    cleartext: true,
    hostname: 'app.local',
    allowNavigation: ['*'],
  },
  plugins: {
    BarcodeScanner: {
      barcodeFormats: ['ALL'],
    },
  },
};

export default config;
