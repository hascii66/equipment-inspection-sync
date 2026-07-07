import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Inspection } from '../models/inspection.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private cordovaDb: any;
  private isDbReady = new BehaviorSubject<boolean>(false);
  private isWeb = false;

  private webStorageKey = 'equipment_inspections_fallback_v3';

  constructor() {
    document.addEventListener('deviceready', () => {
      this.initializeDatabase();
    }, false);

    setTimeout(() => {
      if (!this.isDbReady.value) {
        console.warn('deviceready not received in time. Assuming Web environment.');
        this.isWeb = true;
        this.initWebData();
        this.isDbReady.next(true);
      }
    }, 1500);
  }

  getReadyState(): Observable<boolean> {
    return this.isDbReady.asObservable();
  }

  private async initializeDatabase() {
    try {
      const win = window as any;
      if (!win.sqlitePlugin) {
        console.warn('Cordova sqlitePlugin not found. Falling back to LocalStorage.');
        this.isWeb = true;
        this.initWebData();
        this.isDbReady.next(true);
        return;
      }

      this.cordovaDb = win.sqlitePlugin.openDatabase({
        name: 'inspections_db_v2.db',
        location: 'default'
      });

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
          voltStability REAL,
          imageB64 TEXT
        );
      `;
      
      await this.executeSql(createTableQuery);

      const rows = await this.querySql('SELECT COUNT(*) as count FROM inspections');
      const count = rows[0]?.count || 0;

      if (count === 0) {
        await this.seedData();
      }

      this.isDbReady.next(true);
    } catch (error) {
      console.error('Database initialization failed. Falling back to LocalStorage:', error);
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
        INSERT INTO inspections (id, equipmentId, sysId, equipmentName, dueDate, resultStatus, syncStatus, updatedAt, technicalNotes, opHours, coreTemp, voltStability, imageB64)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      await this.executeSql(query, [
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
        record.voltStability || 0.0,
        record.imageB64 || ''
      ]);
    }
  }

  private executeSql(query: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.cordovaDb.transaction((tx: any) => {
        tx.executeSql(query, params, 
          (tx: any, results: any) => resolve(results),
          (tx: any, err: any) => {
            reject(err);
            return false;
          }
        );
      });
    });
  }

  private querySql(query: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.cordovaDb.transaction((tx: any) => {
        tx.executeSql(query, params, 
          (tx: any, results: any) => {
            const len = results.rows.length;
            const output = [];
            for (let i = 0; i < len; i++) {
              output.push(results.rows.item(i));
            }
            resolve(output);
          },
          (tx: any, err: any) => {
            reject(err);
            return false;
          }
        );
      });
    });
  }

  async getAllInspections(): Promise<Inspection[]> {
    if (this.isWeb) {
      const data = localStorage.getItem(this.webStorageKey);
      return data ? JSON.parse(data) : [];
    }

    return this.querySql('SELECT * FROM inspections ORDER BY dueDate ASC');
  }

  async getInspectionById(id: string): Promise<Inspection | null> {
    if (this.isWeb) {
      const inspections = await this.getAllInspections();
      return inspections.find(i => i.id === id) || null;
    }

    const rows = await this.querySql('SELECT * FROM inspections WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
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
      SET resultStatus = ?, syncStatus = ?, updatedAt = ?, technicalNotes = ?, opHours = ?, coreTemp = ?, voltStability = ?, imageB64 = ?
      WHERE id = ?;
    `;
    await this.executeSql(query, [
      inspection.resultStatus,
      inspection.syncStatus,
      inspection.updatedAt,
      inspection.technicalNotes || '',
      inspection.opHours || 0,
      inspection.coreTemp || 0,
      inspection.voltStability || 0,
      inspection.imageB64 || '',
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
      await this.executeSql(query, [u.syncStatus, new Date().toISOString(), u.id]);
    }
  }
}
