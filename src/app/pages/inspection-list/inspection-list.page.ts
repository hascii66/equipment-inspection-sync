import { Component, OnInit } from '@angular/core';
import { InspectionListViewModel } from './inspection-list.viewmodel';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-inspection-list',
  templateUrl: './inspection-list.page.html',
  styleUrls: ['./inspection-list.page.scss'],
  providers: [InspectionListViewModel],
  standalone: false
})
export class InspectionListPage implements OnInit {
  inspections$ = this.vm.inspections$;
  isSyncing$ = this.vm.isSyncing$;
  isOnline$ = this.vm.isOnline$;

  constructor(
    private vm: InspectionListViewModel,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    // Loaded automatically
  }

  ionViewWillEnter() {
    this.vm.loadInspections();
  }

  async sync() {
    const res = await this.vm.triggerSync();
    if (res.succeeded > 0 || res.failed > 0) {
      const toast = await this.toastCtrl.create({
        message: `Sync completed. Succeeded: ${res.succeeded}, Failed: ${res.failed}`,
        duration: 3000,
        position: 'bottom',
        color: res.failed > 0 ? 'warning' : 'success'
      });
      await toast.present();
    } else {
      const toast = await this.toastCtrl.create({
        message: 'No pending records to sync or offline.',
        duration: 2000,
        position: 'bottom',
        color: 'medium'
      });
      await toast.present();
    }
  }

  getResultColor(status: string): string {
    switch (status) {
      case 'Passed': return 'success';
      case 'Failed': return 'danger';
      default: return 'medium';
    }
  }

  getSyncColor(status: string): string {
    switch (status) {
      case 'Synced': return 'success';
      case 'Failed': return 'danger';
      case 'Pending': return 'warning';
      default: return 'medium';
    }
  }
}
