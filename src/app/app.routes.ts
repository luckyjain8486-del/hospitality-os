import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { OrdersComponent } from './components/orders/orders.component';
import { PosComponent } from './components/pos/pos.component';
import { KdsComponent } from './components/kds/kds.component';
import { TablesComponent } from './components/tables/tables.component';
import { MenuComponent } from './components/menu/menu.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { CrmComponent } from './components/crm/crm.component';
import { LoyaltyComponent } from './components/loyalty/loyalty.component';
import { HotelComponent } from './components/hotel/hotel.component';
import { ReportsComponent } from './components/reports/reports.component';
import { BillingComponent } from './components/billing/billing.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SuperAdminComponent } from './components/super-admin/super-admin.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'pos', component: PosComponent },
  { path: 'kds', component: KdsComponent },
  { path: 'tables', component: TablesComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'inventory', component: InventoryComponent },
  { path: 'customers', component: CrmComponent },
  { path: 'loyalty', component: LoyaltyComponent },
  { path: 'hotel', component: HotelComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'billing', component: BillingComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'super-admin', component: SuperAdminComponent },
  { path: 'super-admin/tenants', component: SuperAdminComponent },
  { path: 'super-admin/entitlements', component: SuperAdminComponent },
  { path: 'super-admin/plans', component: SuperAdminComponent },
  { path: 'super-admin/analytics', component: SuperAdminComponent },
  { path: '**', redirectTo: 'dashboard' },
];
