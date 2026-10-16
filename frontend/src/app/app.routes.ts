import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { OnboardingComponent } from './features/onboarding/onboarding.component';
import { CustomersComponent } from './features/customers/customers.component';
import { KnowledgeBaseComponent } from './features/knowledge-base/knowledge-base.component';
import { InboxComponent } from './features/inbox/inbox.component';
import { WhatsAppIntegrationComponent } from './features/whatsapp/whatsapp.component';
import { TelegramIntegrationComponent } from './features/telegram/telegram.component';
import { AppointmentsComponent } from './features/appointments/appointments.component';
import { AutomationsComponent } from './features/automations/automations.component';
import { SubscriptionsComponent } from './features/subscriptions/subscriptions.component';
import { ReportsComponent } from './features/reports/reports.component';
import { SettingsComponent } from './features/settings/settings.component';
import { AdminComponent } from './features/admin/admin.component';

export const routes: Routes = [
  {
    path: 'auth/login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'auth/register',
    component: RegisterComponent,
    canActivate: [guestGuard]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'onboarding', component: OnboardingComponent },
      { path: 'inbox', component: InboxComponent },
      { path: 'knowledge-base', component: KnowledgeBaseComponent },
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'whatsapp', component: WhatsAppIntegrationComponent },
      { path: 'telegram', component: TelegramIntegrationComponent },
      { path: 'automations', component: AutomationsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'subscriptions', component: SubscriptionsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'admin', component: AdminComponent }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
