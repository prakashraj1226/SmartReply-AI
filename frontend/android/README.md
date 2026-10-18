# SmartReply AI - Android Mobile APK Guide

This document details how the SmartReply AI Android mobile app is built, configured, and installed on an Android device or emulator.

---

## 1. Generated APK Artifact

- **Debug APK Location:**
  `/home/maintwiz/Music/smartreply-ai/frontend/android/app/build/outputs/apk/debug/app-debug.apk`
- **File Size:** ~4.9 MB
- **Target SDK:** Android 15 (API 35), Min SDK: Android 7.0 (API 24)
- **Package ID:** `com.smartreplyai.app`
- **App Name:** `SmartReply AI`

---

## 2. Architecture & Design Rationale

- **Approach Chosen:** **Capacitor wrapper around existing Angular 19 SaaS**.
- **Rationale:** 
  1. Fastest path to a production-ready, installable APK with **zero risk** of API discrepancies.
  2. Directly reuses existing auth tokens, multi-tenant headers (`X-Business-Id`), role permissions, and live conversation pollers.
  3. Preserves 100% of SmartReply branding, color themes, and responsive design without breaking web app behavior.
  4. Added native mobile bottom navigation bar (`Inbox`, `Appointments`, `Customers`, `Settings`) and single-column mobile chat layout with a back button (`←`).

---

## 3. How to Point to Backend URL

The mobile app includes a dynamic backend API switcher that persists in device `localStorage` (`sr_custom_api_url`):

### Options:
1. **Production Backend (Default - Ready Out-of-the-Box):**
   - URL: `https://smartreply-backend-lyda.onrender.com/api`
   - No configuration needed. When installed, it connects directly to the live cloud backend.
2. **Local Machine via Physical Phone (Same Wi-Fi Network):**
   - Find your computer's local IP (e.g. `ip a` or `hostname -I` -> e.g. `192.168.1.10`).
   - URL: `http://192.168.1.10:8081/api`
   - `android:usesCleartextTraffic="true"` is enabled in `AndroidManifest.xml` to allow HTTP over LAN.
3. **Android Emulator:**
   - URL: `http://10.0.2.2:8081/api`

### Changing the Backend URL inside the App:
- **On the Login Screen:** Look at the bottom of the login card and tap **`⚙️ Server: ... (Change)`**. Select a preset (`Prod`, `Emulator`, `Localhost`) or type your custom IP, then tap **Save & Reload**.
- **From Inside the App:** Go to **Settings** (`/settings`) → **📱 App & Server** tab. Enter the desired API URL and tap **Save & Reload App**.

---

## 4. How to Install on an Android Phone

### Method A: Via USB Debugging & `adb` (Fastest for Developers)
1. On your Android phone, enable **Developer Options** and turn on **USB Debugging**.
2. Connect your phone to your computer via USB cable.
3. Verify your device is detected:
   ```bash
   adb devices
   ```
4. Install the APK:
   ```bash
   adb install -r frontend/android/app/build/outputs/apk/debug/app-debug.apk
   ```
5. Launch the app on your phone:
   ```bash
   adb shell am start -n com.smartreplyai.app/com.smartreplyai.app.MainActivity
   ```

### Method B: Direct File Transfer
1. Copy `frontend/android/app/build/outputs/apk/debug/app-debug.apk` to your phone via USB file transfer, Google Drive, or Telegram.
2. Open the file on your phone and tap **Install**.
3. If prompted, allow "Install from unknown sources" for your file manager.

---

## 5. Build Commands (Rebuilding the APK)

To rebuild the APK at any time after making frontend code changes:

### Single Command:
```bash
cd /home/maintwiz/Music/smartreply-ai/frontend
npm run apk:build
```

### Step-by-Step Commands:
```bash
# 1. Build the Angular production bundle
cd /home/maintwiz/Music/smartreply-ai/frontend
npm run build

# 2. Sync web assets into the Android native project
npx cap copy android

# 3. Compile the debug APK using Gradle
cd android
./gradlew assembleDebug
```

The fresh APK will always be output to:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 6. Acceptance Checklist
- [x] Debug APK built and verified (`app-debug.apk` 4.9MB).
- [x] Login screen with secure JWT store (`sr_token`) in `localStorage` + multi-tenant business context.
- [x] Live Inbox with Channel Filter pills (`All`, `WhatsApp`, `Telegram`), default channel = `WHATSAPP`.
- [x] Mobile single-column chat view with back button (`←`) to return to chat list.
- [x] Live message polling without full page reload.
- [x] Mobile bottom navigation bar: **Inbox**, **Appointments**, **Customers**, **Settings (Logout)**.
- [x] Backend URL switcher on Login screen and Settings page.
- [x] Existing Angular web app unaffected (all mobile layout additions scoped via `@media (max-width: 768px)`).
