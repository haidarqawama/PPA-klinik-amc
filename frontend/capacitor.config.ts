import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.klinik.app',
  appName: 'AMC Inventory System',
  webDir: 'out',
  server: {
    url: 'http://192.168.0.101:8080',
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['*'],
  },
  plugins: {
    BarcodeScanner: {
      barcodeFormats: ['ALL'],
    },
  },
};

export default config;
