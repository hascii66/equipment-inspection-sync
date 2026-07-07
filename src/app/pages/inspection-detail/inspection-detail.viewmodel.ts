import { Injectable } from '@angular/core';
import { DatabaseService } from '../../services/database.service';
import { SyncService } from '../../services/sync.service';
import { Inspection } from '../../models/inspection.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class InspectionDetailViewModel {
  private inspectionSubject = new BehaviorSubject<Inspection | null>(null);
  inspection$: Observable<Inspection | null> = this.inspectionSubject.asObservable();

  isOnline$: Observable<boolean>;

  constructor(
    private dbService: DatabaseService,
    private syncService: SyncService
  ) {
    this.isOnline$ = this.syncService.connectionStatus$;
  }

  async loadInspection(id: string) {
    this.dbService.getReadyState().subscribe(async (ready) => {
      if (ready) {
        const item = await this.dbService.getInspectionById(id);
        this.inspectionSubject.next(item);
      }
    });
  }

  async saveStatus(result: 'Passed' | 'Failed', notes?: string, imageB64?: string | null) {
    const current = this.inspectionSubject.value;
    if (!current) return;

    const updated: Inspection = {
      ...current,
      resultStatus: result,
      technicalNotes: notes ?? current.technicalNotes,
      imageB64: imageB64 !== undefined ? (imageB64 ?? undefined) : current.imageB64,
      syncStatus: 'Pending'
    };

    await this.dbService.updateInspection(updated);
    this.inspectionSubject.next(updated);
  }
}
