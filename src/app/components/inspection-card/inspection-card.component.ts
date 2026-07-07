import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Inspection } from '../../models/inspection.model';

@Component({
  selector: 'app-inspection-card',
  templateUrl: './inspection-card.component.html',
  styleUrls: ['./inspection-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslatePipe]
})
export class InspectionCardComponent {
  @Input() item!: Inspection;
}
