# Record POW

https://github.com/user-attachments/assets/de4ae546-ecbc-4a78-b86f-88f0f5dc303b

# Equipment Inspector (Offline-First Mobile App)

This is an offline-first mobile app for recording equipment inspections, built with **Ionic Framework**, **Angular 19**, and **Cordova**. It helps field technicians log inspections even when they're completely offline, and automatically syncs the data back when the connection returns.

---

## Quick Start

Here is how to get the project up and running:

### 1. Requirements & Install
Make sure you are using Node 22 (or at least 20):
```bash
nvm use 22
npm install
```

### 2. Run the Mock API Server (Terminal 1)
We use `json-server` to mock the central backend database. Keep this running in the background:
```bash
npm run mock-server
```

### 3. Run the Web App (Terminal 2)
Test the app interface instantly in your web browser:
```bash
npx ionic serve
```

### 4. Run on Simulators/Emulators
Because of Angular 19's custom build system, we build the web bundle first, then deploy it using Cordova:

```bash
# Compile web assets
npx ionic build

# Copy web assets to native platforms
npx cordova prepare

# Or Compile both web and native assets
npx ionic build && npx cordova prepare

# Launch iOS Simulator
npx cordova emulate ios

# Launch Android Emulator
npx cordova emulate android
```

---

## Features Implemented

* **Offline SQLite Database**: Runs on a native SQLite database with a seamless **LocalStorage fallback** for web browser reviews.
* **Camera & Barcode Scanner**: Fully integrated native Cordova camera and barcode scanner (with clean simulated web fallbacks so you can test them in your browser).
* **Smart Syncing**: 
  * Displays color-coded sync status (Synced, Pending, Failed).
  * Auto-triggers sync in the background when the app detects your device goes back online.
  * Supports **Partial Success**—if one record fails to sync, others will still go through successfully.
* **Aesthetics**: Features a clean, dark futuristic theme, smooth transitions, and high-contrast status bars.
* **100% English & i18n**: Built using `@ngx-translate` v18 standalone architecture.

---

## Architectural & Sync Decisions

### 1. Offline-First Architecture
* All data writes and updates during inspection (Passed/Failed result selection, Technical Notes input, Photo Attachments) are immediately saved to the local SQLite database (`inspections_db_v2.db`).
* No network calls are made during the save operation, ensuring zero delay and absolute reliability in remote offline environments.

### 2. MVVM Design Pattern
* The business logic is strictly decoupled from the UI components. ViewModels (`InspectionListViewModel` and `InspectionDetailViewModel`) act as data brokers between the Angular UI pages and the core Services.
* Database operations (`DatabaseService`) and Web Synchronization (`SyncService`) are encapsulated inside injectable Angular Services.

### 3. Sync & Conflict Assumptions
* **Last-Write-Wins**: The technician's device is assumed to be the single source of truth for their assigned inspection sheet, thus conflicts are resolved by overwriting the backend record with the latest locally captured parameters.
* **Partial Success Handling**: Individual API calls are wrapped in dedicated `try-catch` blocks. If 3 of 5 records sync successfully but 2 fail (e.g., due to specific data validation or server timeout), the successful 3 are marked `Synced` locally, while the 2 failures remain in the queue as `Failed` for later retry.
* **Automatic Reconnect Trigger**: Listening to the browser/cordova `online` event automatically resumes the queued sync process once connection status shifts back to online.

### 4. Native & Simulator Fallbacks
* To support running in standard desktop web browsers and iOS/Android Simulator platforms (where physical cameras or scanning modules may be unavailable), we designed responsive fallback fallbacks:
  * Camera triggers a native file/camera selector on browsers and simulators.
  * Barcode scanner opens a manual simulation modal prefilled with target test values.

### 5. Skipped Scope
* **User Authentication**: Standard user auth flow (login/token) was omitted because the scope focused strictly on offline persistence, native plugins, and REST sync handling.
* **Conflict Resolution UI**: Interactive merge/conflict UI was skipped under the assumption that inspections are individually assigned to single technicians.

