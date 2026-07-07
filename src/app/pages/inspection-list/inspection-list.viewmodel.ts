import { Injectable } from '@angular/core';
import { DatabaseService } from '../../services/database.service';
import { SyncService } from '../../services/sync.service';
import { Inspection } from '../../models/inspection.model';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class InspectionListViewModel {
  private inspectionsSubject = new BehaviorSubject<Inspection[]>([]);
  private searchQuerySubject = new BehaviorSubject<string>('');

  inspections$: Observable<Inspection[]> = combineLatest([
    this.inspectionsSubject.asObservable(),
    this.searchQuerySubject.asObservable()
  ]).pipe(
    map(([inspections, query]) => {
      if (!query || query.trim() === '') {
        return inspections;
      }
      const lowerQuery = query.toLowerCase();
      return inspections.filter(item => 
        item.equipmentName.toLowerCase().includes(lowerQuery) ||
        item.equipmentId.toLowerCase().includes(lowerQuery) ||
        item.resultStatus.toLowerCase().includes(lowerQuery) ||
        item.syncStatus.toLowerCase().includes(lowerQuery)
      );
    })
  );

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

  setSearchQuery(query: string) {
    this.searchQuerySubject.next(query);
  }

  async triggerSync(): Promise<{ succeeded: number; failed: number }> {
    const result = await this.syncService.sync();
    await this.loadInspections();
    return result;
  }
}
