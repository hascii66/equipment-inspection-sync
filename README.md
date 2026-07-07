# Equipment Inspector (Offline-First Mobile App)

This is an offline-first equipment inspection mobile application built using **Ionic Framework**, **Angular**, **Capacitor**, and **SQLite**. It allows field technicians to perform inspections, record results offline, and synchronize data back to a centralized server when internet connectivity becomes available.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v10+ recommended)
- Ionic CLI (installed globally or run via `npx`):
  ```bash
  npm install -g @ionic/cli
  ```

### Installation
1. Clone or download the project files.
2. Navigate to the root directory and install dependencies:
   ```bash
   npm install
   ```

### Running the Mock REST API Server
The application uses a local JSON database server to simulate API endpoints. Start it in a separate terminal:
```bash
npm run mock-server
```
This runs the mock server at [http://localhost:3000/inspections](http://localhost:3000/inspections).

### Running the App Locally (Web Browser)
To run the Angular application in your local browser with live-reloading:
```bash
npx ionic serve
```
> **Note on Web Fallback**: Since raw SQLite commands require a native device platform, the app detects browser runtime environments and automatically switches to a robust local storage mock database layer, allowing you to test the offline-first experience seamlessly in standard web browsers!

---

## 🏗️ Architectural Decisions & Separations of Concerns

1. **TypeScript Strict Mode**: Entire codebase is written using strictly defined interfaces and typed parameters to avoid standard runtime faults and improve development velocities.
2. **ViewModel Separation Pattern**: Underneath each view page component, a dedicated `ViewModel` (e.g. `InspectionListViewModel`) manages state logic and coordinates with underlying services. Component classes (`.page.ts`) contain zero business logic and act purely as controllers for binding inputs and displaying toast alerts.
3. **Database Layer Abstraction**: A standalone service (`DatabaseService`) abstracts data queries and handles platform detection. It uses `@capacitor-community/sqlite` on native and switches to localStorage simulation on web.
4. **Resilient Sync Engine**: A dedicated `SyncService` listens to network connectivity updates via the `@capacitor/network` plugin. Reconnection immediately triggers background synchronization of pending data.

---

## 🔄 Sync Strategy & Partial Failure Design

- **Partial Success Handling**: The sync process runs sequentially or as individual concurrent requests. If certain records succeed and others fail (e.g., server validation failure for a particular equipment ID), succeeded records are immediately updated as `Synced` while failed records remain `Failed`/`Pending` in the SQLite database queue, retrying at the next connectivity event.
- **Conflict Resolution (Assumptions)**:
  - **Client-Wins/Last-Write-Wins**: Since field technicians are typically assigned specific devices and equipment tasks, the client's local updates are treated as the source of truth and overwrite server entries.
  - **Timestamps**: All records are tagged with an `updatedAt` ISO timestamp to audit synchronization timing.

---

## 🛠️ What would be done differently with more time

1. **Conflict Resolution Strategy**: Implement a vector-clock or server-side revision checking mechanism to flag conflicts instead of simple client-wins overrides.
2. **True Web WASM SQLite**: Build standard WebAssembly SQLite drivers (`jeep-sqlite` integration) to mirror exact relational SQL behavior on browsers instead of localStorage mapping.
3. **Optimistic UI Updates**: Display smooth animations reflecting background synchronization progress instantly on the home dashboard.
