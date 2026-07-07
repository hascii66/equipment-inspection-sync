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

  // Web fallback storage (versioned to force update)
  private webStorageKey = 'equipment_inspections_fallback_v3';

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
        'inspections_db_v2',
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS inspections (
          id TEXT PRIMARY KEY,
          equipmentId TEXT NOT NULL,
          sysId TEXT NOT NULL,
          equipmentName TEXT NOT NULL,
          dueDate TEXT NOT NULL,
          resultStatus TEXT NOT NULL,
          syncStatus TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          technicalNotes TEXT,
          opHours INTEGER,
          coreTemp REAL,
          voltStability REAL
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
        equipmentId: 'UNIT-8839',
        sysId: 'HVAC-8839-A',
        equipmentName: 'HVAC Compressor 01',
        dueDate: '2026-07-10',
        resultStatus: 'Pending',
        syncStatus: 'Pending',
        updatedAt: new Date().toISOString(),
        technicalNotes: '',
        opHours: 8520,
        coreTemp: 38.2,
        voltStability: 99.4
      },
      {
        id: '2',
        equipmentId: 'GEN-B2',
        sysId: 'GEN-1029-B',
        equipmentName: 'Main Generator B',
        dueDate: '2026-07-12',
        resultStatus: 'Passed',
        syncStatus: 'Synced',
        updatedAt: new Date().toISOString(),
        technicalNotes: 'Nominal operation parameters confirmed.',
        opHours: 14200,
        coreTemp: 72.5,
        voltStability: 98.1
      },
      {
        id: '3',
        equipmentId: 'PUMP-A',
        sysId: 'PUMP-0021-X',
        equipmentName: 'Water Pump Alpha',
        dueDate: '2026-07-08',
        resultStatus: 'Failed',
        syncStatus: 'Failed',
        updatedAt: new Date().toISOString(),
        technicalNotes: 'Valves leaking, pressure loss detected.',
        opHours: 3100,
        coreTemp: 24.1,
        voltStability: 99.7
      },
      {
        id: '4',
        equipmentId: 'FAP-04',
        sysId: 'FAP-9921-C',
        equipmentName: 'Fire Alarm Panel 4',
        dueDate: '2026-07-15',
        resultStatus: 'Pending',
        syncStatus: 'Synced',
        updatedAt: new Date().toISOString(),
        technicalNotes: '',
        opHours: 24300,
        coreTemp: 28.6,
        voltStability: 99.9
      },
      {
        id: '5',
        equipmentId: 'ELEV-CC',
        sysId: 'EC-4022-B',
        equipmentName: 'Elevator Control Cabin',
        dueDate: '2026-07-20',
        resultStatus: 'Pending',
        syncStatus: 'Synced',
        updatedAt: new Date().toISOString(),
        technicalNotes: '',
        opHours: 12482,
        coreTemp: 42.5,
        voltStability: 99.8
      }
    ];
  }

  private async seedData() {
    const seed = this.getSeedRecords();
    for (const record of seed) {
      const query = `
        INSERT INTO inspections (id, equipmentId, sysId, equipmentName, dueDate, resultStatus, syncStatus, updatedAt, technicalNotes, opHours, coreTemp, voltStability)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      await this.db.run(query, [
        record.id,
        record.equipmentId,
        record.sysId,
        record.equipmentName,
        record.dueDate,
        record.resultStatus,
        record.syncStatus,
        record.updatedAt,
        record.technicalNotes || '',
        record.opHours || 0,
        record.coreTemp || 0.0,
        record.voltStability || 0.0
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
      SET resultStatus = ?, syncStatus = ?, updatedAt = ?, technicalNotes = ?, opHours = ?, coreTemp = ?, voltStability = ?
      WHERE id = ?;
    `;
    await this.db.run(query, [
      inspection.resultStatus,
      inspection.syncStatus,
      inspection.updatedAt,
      inspection.technicalNotes || '',
      inspection.opHours || 0,
      inspection.coreTemp || 0,
      inspection.voltStability || 0,
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
