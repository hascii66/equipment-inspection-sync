import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController, ActionSheetController, AlertController } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  attachedImageB64: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vm: InspectionDetailViewModel,
    private toastCtrl: ToastController,
    private sanitizer: DomSanitizer,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController
  ) {}

  getSafeImageUrl(base64: string | null): SafeResourceUrl | null {
    if (!base64) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(base64);
  }

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
          this.attachedImageB64 = item.imageB64 || null;
        }
      });
    }
  }

  selectResult(result: 'Passed' | 'Failed') {
    this.selectedResult = result;
  }

  async attachImage() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Select Image Source',
      buttons: [
        {
          text: 'Take Photo',
          icon: 'camera-outline',
          handler: () => {
            this.openNativeCamera();
          }
        },
        {
          text: 'Choose from Files',
          icon: 'image-outline',
          handler: () => {
            this.triggerFilePicker();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: 'close-outline'
        }
      ]
    });
    await actionSheet.present();
  }

  openNativeCamera() {
    const camera = (navigator as any).camera;
    if (camera) {
      camera.getPicture(
        (imageData: string) => {
          if (imageData.startsWith('data:') || imageData.startsWith('file:') || imageData.startsWith('content:') || imageData.startsWith('assets-library:')) {
            this.attachedImageB64 = imageData;
          } else {
            this.attachedImageB64 = 'data:image/jpeg;base64,' + imageData;
          }
          console.log('Attached image destination path:', this.attachedImageB64.substring(0, 100));
        },
        async (err: any) => {
          console.warn('Camera failed/unsupported. Falling back to local file picker...', err);
          this.triggerFilePicker();
        },
        {
          quality: 50,
          destinationType: camera.DestinationType.DATA_URL,
          sourceType: camera.PictureSourceType.CAMERA,
          encodingType: camera.EncodingType.JPEG,
          mediaType: camera.MediaType.PICTURE,
          correctOrientation: true
        }
      );
    } else {
      console.warn('Cordova Camera not found. Opening local file picker...');
      this.triggerFilePicker();
    }
  }

  triggerFilePicker() {
    const fileInput = document.getElementById('camera-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.attachedImageB64 = reader.result as string;
        console.log('File attached successfully via picker.');
      };
      reader.readAsDataURL(file);
    }
  }

  async scanBarcode() {
    const scanner = (window as any).cordova?.plugins?.barcodeScanner;
    if (scanner) {
      scanner.scan(
        async (result: any) => {
          if (!result.cancelled) {
            const toast = await this.toastCtrl.create({
              message: `Barcode Scanned: ${result.text} (${result.format})`,
              duration: 3000,
              color: 'success'
            });
            await toast.present();
          }
        },
        async (error: any) => {
          console.warn('Barcode scanner native error, falling back to manual entry:', error);
          this.fallbackBarcodeEntry();
        }
      );
    } else {
      console.warn('Cordova BarcodeScanner not found. Falling back to manual entry.');
      this.fallbackBarcodeEntry();
    }
  }

  async fallbackBarcodeEntry() {
    const alert = await this.alertCtrl.create({
      header: 'Scan Simulator',
      message: 'Physical camera is not available on simulator. Enter simulated barcode:',
      inputs: [
        {
          name: 'barcode',
          type: 'text',
          value: 'UNIT-8839',
          placeholder: 'Barcode value'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Simulate Scan',
          handler: async (data) => {
            if (data.barcode) {
              const toast = await this.toastCtrl.create({
                message: `Barcode Simulated: ${data.barcode}`,
                duration: 3000,
                color: 'success'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async save() {
    if (!this.selectedResult) return;
    await this.vm.saveStatus(this.selectedResult, this.technicalNotes, this.attachedImageB64);

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
