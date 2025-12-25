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
  // iOS Permission Descriptions (add to Info.plist when running `npx cap sync`)
  ios: {
    contentInset: 'automatic',
  },
  // Android permissions are defined in AndroidManifest.xml
  android: {
    allowMixedContent: true,
  },
};

export default config;

/**
 * iOS Info.plist additions (add manually after `npx cap add ios`):
 * 
 * <key>NSMicrophoneUsageDescription</key>
 * <string>Roomy needs microphone access to send voice messages</string>
 * 
 * <key>NSCameraUsageDescription</key>
 * <string>Roomy needs camera access for virtual room tours and photos</string>
 * 
 * <key>NSPhotoLibraryUsageDescription</key>
 * <string>Roomy needs photo library access to share images</string>
 * 
 * Android AndroidManifest.xml additions (add manually after `npx cap add android`):
 * 
 * <uses-permission android:name="android.permission.RECORD_AUDIO" />
 * <uses-permission android:name="android.permission.CAMERA" />
 * <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
 * <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
 */
