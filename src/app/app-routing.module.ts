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
    loadComponent: () => import('./pages/inspection-list/inspection-list.page').then(m => m.InspectionListPage)
  },
  {
    path: 'inspections/:id',
    loadComponent: () => import('./pages/inspection-detail/inspection-detail.page').then(m => m.InspectionDetailPage)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

