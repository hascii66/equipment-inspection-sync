import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { InspectionDetailViewModel } from './inspection-detail.viewmodel';

@Component({
  selector: 'app-inspection-detail',
  templateUrl: './inspection-detail.page.html',
  styleUrls: ['./inspection-detail.page.scss'],
  providers: [InspectionDetailViewModel],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslatePipe,
    RouterModule
  ]
})
export class InspectionDetailPage implements OnInit {
  inspection$ = this.vm.inspection$;
  isOnline$ = this.vm.isOnline$;
  selectedResult: 'Passed' | 'Failed' | null = null;
  technicalNotes: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vm: InspectionDetailViewModel,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.vm.loadInspection(id);
      this.inspection$.subscribe(item => {
        if (item) {
          if (item.resultStatus !== 'Pending') {
            this.selectedResult = item.resultStatus as 'Passed' | 'Failed';
          }
          this.technicalNotes = item.technicalNotes || '';
        }
      });
    }
  }

  selectResult(result: 'Passed' | 'Failed') {
    this.selectedResult = result;
  }

  async save() {
    if (!this.selectedResult) return;
    await this.vm.saveStatus(this.selectedResult, this.technicalNotes);

    const toast = await this.toastCtrl.create({
      message: 'Saved successfully to offline SQLite database!',
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
    
    this.router.navigate(['/inspections']);
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
