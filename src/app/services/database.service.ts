import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SQLiteConnection, SQLiteDBConnection, CapacitorSQLite } from '@capacitor-community/sqlite';
import { Inspection } from '../models/inspection.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqliteConnection!: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private isDbReady = new BehaviorSubject<boolean>(false);
  private isWeb = false;

  // Web fallback storage
  private webStorageKey = 'equipment_inspections_fallback';

  constructor() {
    this.isWeb = !Capacitor.isNativePlatform();
    this.initializeDatabase();
  }

  getReadyState(): Observable<boolean> {
    return this.isDbReady.asObservable();
  }

  private async initializeDatabase() {
    try {
      if (this.isWeb) {
        console.warn('Running on Web. Fallback to LocalStorage database simulation.');
        this.initWebData();
        this.isDbReady.next(true);
        return;
      }

      this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
      this.db = await this.sqliteConnection.createConnection(
        'inspections_db',
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS inspections (
          id TEXT PRIMARY KEY,
          equipmentName TEXT NOT NULL,
          dueDate TEXT NOT NULL,
          resultStatus TEXT NOT NULL,
          syncStatus TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `;
      await this.db.execute(createTableQuery);

      // Check if table is empty
      const checkEmpty = await this.db.query('SELECT COUNT(*) as count FROM inspections');
      const count = checkEmpty.values?.[0]?.count || 0;

      if (count === 0) {
        await this.seedData();
      }

      this.isDbReady.next(true);
    } catch (error) {
      console.error('Database initialization failed. Falling back to simulated storage:', error);
      this.isWeb = true;
      this.initWebData();
      this.isDbReady.next(true);
    }
  }

  private initWebData() {
    const data = localStorage.getItem(this.webStorageKey);
    if (!data) {
      const seed: Inspection[] = this.getSeedRecords();
      localStorage.setItem(this.webStorageKey, JSON.stringify(seed));
    }
  }

  private getSeedRecords(): Inspection[] {
    return [
      {
        id: '1',
        equipmentName: 'HVAC Compressor 01',
        dueDate: '2026-07-10',
        resultStatus: 'Pending',
        syncStatus: 'Pending',
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        equipmentName: 'Main Generator B',
        dueDate: '2026-07-12',
        resultStatus: 'Passed',
        syncStatus: 'Synced',
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        equipmentName: 'Water Pump Alpha',
        dueDate: '2026-07-08',
        resultStatus: 'Failed',
        syncStatus: 'Failed',
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        equipmentName: 'Fire Alarm Panel 4',
        dueDate: '2026-07-15',
        resultStatus: 'Pending',
        syncStatus: 'Pending',
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        equipmentName: 'Elevator Control Cabin',
        dueDate: '2026-07-20',
        resultStatus: 'Pending',
        syncStatus: 'Pending',
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private async seedData() {
    const seed = this.getSeedRecords();
    for (const record of seed) {
      const query = `
        INSERT INTO inspections (id, equipmentName, dueDate, resultStatus, syncStatus, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?);
      `;
      await this.db.run(query, [
        record.id,
        record.equipmentName,
        record.dueDate,
        record.resultStatus,
        record.syncStatus,
        record.updatedAt
      ]);
    }
  }

  async getAllInspections(): Promise<Inspection[]> {
    if (this.isWeb) {
      const data = localStorage.getItem(this.webStorageKey);
      return data ? JSON.parse(data) : [];
    }

    const res = await this.db.query('SELECT * FROM inspections ORDER BY dueDate ASC');
    return (res.values || []) as Inspection[];
  }

  async getInspectionById(id: string): Promise<Inspection | null> {
    if (this.isWeb) {
      const inspections = await this.getAllInspections();
      return inspections.find(i => i.id === id) || null;
    }

    const res = await this.db.query('SELECT * FROM inspections WHERE id = ?', [id]);
    return res.values && res.values.length > 0 ? (res.values[0] as Inspection) : null;
  }

  async updateInspection(inspection: Inspection): Promise<void> {
    inspection.updatedAt = new Date().toISOString();
    if (this.isWeb) {
      const inspections = await this.getAllInspections();
      const idx = inspections.findIndex(i => i.id === inspection.id);
      if (idx !== -1) {
        inspections[idx] = inspection;
        localStorage.setItem(this.webStorageKey, JSON.stringify(inspections));
      }
      return;
    }

    const query = `
      UPDATE inspections
      SET resultStatus = ?, syncStatus = ?, updatedAt = ?
      WHERE id = ?;
    `;
    await this.db.run(query, [
      inspection.resultStatus,
      inspection.syncStatus,
      inspection.updatedAt,
      inspection.id
    ]);
  }

  async updateSyncStatuses(updates: { id: string; syncStatus: 'Synced' | 'Failed' }[]): Promise<void> {
    if (this.isWeb) {
      const inspections = await this.getAllInspections();
      updates.forEach(u => {
        const item = inspections.find(i => i.id === u.id);
        if (item) {
          item.syncStatus = u.syncStatus;
          item.updatedAt = new Date().toISOString();
        }
      });
      localStorage.setItem(this.webStorageKey, JSON.stringify(inspections));
      return;
    }

    for (const u of updates) {
      const query = `
        UPDATE inspections
        SET syncStatus = ?, updatedAt = ?
        WHERE id = ?;
      `;
      await this.db.run(query, [u.syncStatus, new Date().toISOString(), u.id]);
    }
  }
}
