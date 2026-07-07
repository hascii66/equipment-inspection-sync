import { Injectable } from '@angular/core';
import { DatabaseService } from '../../services/database.service';
import { SyncService } from '../../services/sync.service';
import { Inspection } from '../../models/inspection.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class InspectionListViewModel {
  private inspectionsSubject = new BehaviorSubject<Inspection[]>([]);
  inspections$: Observable<Inspection[]> = this.inspectionsSubject.asObservable();

  isSyncing$: Observable<boolean>;
  isOnline$: Observable<boolean>;

  constructor(
    private dbService: DatabaseService,
    private syncService: SyncService
  ) {
    this.isSyncing$ = this.syncService.isSyncing$;
    this.isOnline$ = this.syncService.connectionStatus$;
  }

  async loadInspections() {
    this.dbService.getReadyState().subscribe(async (ready) => {
      if (ready) {
        const list = await this.dbService.getAllInspections();
        this.inspectionsSubject.next(list);
      }
    });
  }

  async triggerSync(): Promise<{ succeeded: number; failed: number }> {
    const result = await this.syncService.sync();
    await this.loadInspections();
    return result;
  }
}
