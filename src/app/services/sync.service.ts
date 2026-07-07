import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatabaseService } from './database.service';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private mockApiUrl = 'http://localhost:3000/inspections';
  
  private isSyncingSubject = new BehaviorSubject<boolean>(false);
  isSyncing$: Observable<boolean> = this.isSyncingSubject.asObservable();

  private connectionStatusSubject = new BehaviorSubject<boolean>(true);
  connectionStatus$: Observable<boolean> = this.connectionStatusSubject.asObservable();

  constructor(
    private dbService: DatabaseService,
    private http: HttpClient,
    private ngZone: NgZone
  ) {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    this.connectionStatusSubject.next(navigator.onLine);

    window.addEventListener('online', () => {
      this.ngZone.run(async () => {
        console.log('Device went Online. Auto-triggering sync...');
        this.connectionStatusSubject.next(true);
        await this.sync();
      });
    });

    window.addEventListener('offline', () => {
      this.ngZone.run(() => {
        console.log('Device went Offline.');
        this.connectionStatusSubject.next(false);
      });
    });

    document.addEventListener('deviceready', () => {
      this.ngZone.run(() => {
        this.connectionStatusSubject.next(navigator.onLine);
      });
    }, false);
  }

  async sync(): Promise<{ succeeded: number; failed: number }> {
    if (this.isSyncingSubject.value) {
      return { succeeded: 0, failed: 0 };
    }

    const isOnline = this.connectionStatusSubject.value;
    if (!isOnline) {
      console.warn('Cannot sync: Device is offline.');
      return { succeeded: 0, failed: 0 };
    }

    this.isSyncingSubject.next(true);
    let succeededCount = 0;
    let failedCount = 0;

    try {
      const isDbReady = await firstValueFrom(this.dbService.getReadyState());
      if (!isDbReady) {
        throw new Error('Database is not ready.');
      }

      const inspections = await this.dbService.getAllInspections();
      const recordsToSync = inspections.filter(
        record => record.syncStatus === 'Pending' || record.syncStatus === 'Failed'
      );

      console.log(`Found ${recordsToSync.length} records needing sync.`);

      const updates: { id: string; syncStatus: 'Synced' | 'Failed' }[] = [];

      for (const record of recordsToSync) {
        try {
          let exists = false;
          try {
            await firstValueFrom(this.http.get(`${this.mockApiUrl}/${record.id}`));
            exists = true;
          } catch (e: any) {
            if (e && e.status !== 404) {
              throw e;
            }
          }

          if (exists) {
            await firstValueFrom(this.http.put(`${this.mockApiUrl}/${record.id}`, record));
          } else {
            await firstValueFrom(this.http.post(this.mockApiUrl, record));
          }
          
          updates.push({ id: record.id, syncStatus: 'Synced' });
          succeededCount++;
        } catch (err) {
          console.error(`Failed to sync record ${record.id}:`, err);
          updates.push({ id: record.id, syncStatus: 'Failed' });
          failedCount++;
        }
      }

      if (updates.length > 0) {
        await this.dbService.updateSyncStatuses(updates);
      }
    } catch (err) {
      console.error('Error during synchronization process:', err);
    } finally {
      this.isSyncingSubject.next(false);
    }

    return { succeeded: succeededCount, failed: failedCount };
  }
}
