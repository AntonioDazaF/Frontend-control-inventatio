import { Routes } from '@angular/router';
import { InventoryListComponent } from './inventory-list/inventory-list.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { AuthGuard } from '../core/guards/auth.guard';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    component: InventoryListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'new',
    component: ProductFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'edit/:id',
    component: ProductFormComponent,
    canActivate: [AuthGuard]
  }
];
