import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'inspections',
    pathMatch: 'full'
  },
  {
    path: 'inspections',
    loadChildren: () => import('./pages/inspection-list/inspection-list.module').then(m => m.InspectionListPageModule)
  },
  {
    path: 'inspections/:id',
    loadChildren: () => import('./pages/inspection-detail/inspection-detail.module').then(m => m.InspectionDetailPageModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

