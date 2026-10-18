import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="topbar">
      <!-- Left: Breadcrumb, Page Icon & Title (Matching Reference 4 & 5) -->
      <div class="topbar-left">
        <div class="page-icon-badge">
          <svg *ngIf="currentRouteKey === 'dashboard'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <rect width="7" height="9" x="3" y="3" rx="1.5"></rect>
            <rect width="7" height="5" x="14" y="3" rx="1.5"></rect>
            <rect width="7" height="9" x="14" y="12" rx="1.5"></rect>
            <rect width="7" height="5" x="3" y="16" rx="1.5"></rect>
          </svg>
          <svg *ngIf="currentRouteKey === 'inbox'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <svg *ngIf="currentRouteKey === 'knowledge-base'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
            <path d="M6 6h10"></path>
            <path d="M6 10h10"></path>
          </svg>
          <svg *ngIf="currentRouteKey === 'appointments'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
            <line x1="16" x2="16" y1="2" y2="6"></line>
            <line x1="8" x2="8" y1="2" y2="6"></line>
            <line x1="3" x2="19" y1="10" y2="10"></line>
          </svg>
          <svg *ngIf="currentRouteKey === 'customers'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <svg *ngIf="currentRouteKey !== 'dashboard' && currentRouteKey !== 'inbox' && currentRouteKey !== 'knowledge-base' && currentRouteKey !== 'appointments' && currentRouteKey !== 'customers'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>

        <div class="breadcrumb-title-wrap">
          <div class="breadcrumb-row">
            <span class="breadcrumb-section">{{ sectionLabel }}</span>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-greeting">{{ greeting }}, {{ getUserDisplayName() }}</span>
          </div>
          <h1 class="page-header-title">{{ pageTitle }}</h1>
        </div>
      </div>

      <!-- Right: Controls, Dark Toggle, Date Pill & User Avatar (Reference 4 & 5) -->
      <div class="topbar-right">
        <!-- Live Status Pill -->
        <div class="connection-pill" title="WhatsApp Meta Cloud API Sandbox Mode">
          <span class="status-dot"></span>
          <span class="status-text">Sandbox Active</span>
        </div>

        <!-- Dark Mode Toggle (Visual reference from screenshot 4 & 5) -->
        <button type="button" class="icon-pill-btn" title="Toggle Theme (Auto)" (click)="toggleTheme()">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>

        <!-- Formatted Date Badge (Exact format from screenshot 4 & 5) -->
        <div class="date-pill">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
            <line x1="16" x2="16" y1="2" y2="6"></line>
            <line x1="8" x2="8" y1="2" y2="6"></line>
            <line x1="3" x2="19" y1="10" y2="10"></line>
          </svg>
          <span>{{ currentDateFormatted }}</span>
        </div>

        <!-- User Profile Avatar & Logout -->
        <div class="user-menu" *ngIf="authService.currentUser() as user">
          <div class="user-avatar-circle" [title]="user.fullName + ' (' + user.role + ')'">
            {{ user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div class="user-meta-compact">
            <span class="user-name-text">{{ user.fullName }}</span>
            <span class="user-role-badge">{{ user.role.replace('_', ' ') }}</span>
          </div>
          <button class="logout-icon-btn" (click)="logout()" title="Logout from Workspace">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" x2="9" y1="12" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: 48px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    /* Soft Blue Rounded Icon Badge (From Reference 4 & 5) */
    .page-icon-badge {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
      flex-shrink: 0;
    }

    .page-icon-badge svg {
      width: 15px;
      height: 15px;
    }

    .breadcrumb-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.05rem;
    }

    .breadcrumb-row {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.65rem;
      color: #64748b;
      font-weight: 500;
    }

    .breadcrumb-section {
      color: #64748b;
      font-weight: 600;
    }

    .breadcrumb-sep {
      color: #cbd5e1;
    }

    .breadcrumb-greeting {
      color: #475569;
    }

    .page-header-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0;
      line-height: 1.15;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }

    .connection-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 0.18rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 700;
      color: #166534;
    }

    .status-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
    }

    /* Icon Pill Button (Moon / Theme) */
    .icon-pill-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .icon-pill-btn:hover {
      background: #f8fafc;
      color: #0f172a;
      border-color: #cbd5e1;
    }

    /* Date Pill (Reference 4 & 5) */
    .date-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #334155;
    }

    .date-pill svg {
      color: #2563eb;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-left: 0.45rem;
      border-left: 1px solid #e2e8f0;
    }

    .user-avatar-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
      cursor: pointer;
    }

    .user-meta-compact {
      display: flex;
      flex-direction: column;
    }

    .user-name-text {
      font-size: 0.75rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.15;
    }

    .user-role-badge {
      font-size: 0.575rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .logout-icon-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .logout-icon-btn:hover {
      color: #ef4444;
      background: #fee2e2;
    }

    @media (max-width: 900px) {
      .date-pill, .connection-pill, .user-meta-compact {
        display: none;
      }
    }

    /* Mobile app chrome — desktop topbar unchanged */
    @media (max-width: 768px) {
      .topbar {
        height: 52px;
        padding: 0 0.65rem;
      }
      .breadcrumb-row {
        display: none;
      }
      .page-header-title {
        font-size: 1.05rem;
        line-height: 1.2;
      }
      .page-icon-badge {
        width: 32px;
        height: 32px;
      }
      .icon-pill-btn {
        width: 34px;
        height: 34px;
      }
      .user-avatar-circle {
        width: 32px;
        height: 32px;
        font-size: 0.8rem;
      }
    }
  `]
})
export class TopbarComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);

  currentRouteKey = 'dashboard';
  sectionLabel = 'Operations';
  pageTitle = 'Executive Dashboard';
  greeting = 'Good evening';
  currentDateFormatted = '';

  ngOnInit(): void {
    this.updateGreeting();
    this.updateDate();
    this.syncRouteInfo(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.syncRouteInfo(event.urlAfterRedirects || event.url);
      });
  }

  getUserDisplayName(): string {
    const user = this.authService.currentUser();
    if (!user) return 'Staff';
    if (user.fullName) {
      const parts = user.fullName.split(' ');
      return parts[0];
    }
    return 'Staff';
  }

  private updateGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting = 'Good morning';
    } else if (hour < 17) {
      this.greeting = 'Good afternoon';
    } else {
      this.greeting = 'Good evening';
    }
  }

  private updateDate(): void {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    this.currentDateFormatted = now.toLocaleDateString('en-GB', options);
  }

  private syncRouteInfo(url: string): void {
    if (url.includes('/inbox')) {
      this.currentRouteKey = 'inbox';
      this.sectionLabel = 'Operations';
      this.pageTitle = 'Live Inbox';
    } else if (url.includes('/knowledge-base')) {
      this.currentRouteKey = 'knowledge-base';
      this.sectionLabel = 'AI Grounding';
      this.pageTitle = 'Knowledge Base & FAQs';
    } else if (url.includes('/appointments')) {
      this.currentRouteKey = 'appointments';
      this.sectionLabel = 'Operations';
      this.pageTitle = 'Appointments & Bookings';
    } else if (url.includes('/customers')) {
      this.currentRouteKey = 'customers';
      this.sectionLabel = 'Operations';
      this.pageTitle = 'Customers & WhatsApp CRM';
    } else if (url.includes('/whatsapp')) {
      this.currentRouteKey = 'whatsapp';
      this.sectionLabel = 'Integrations';
      this.pageTitle = 'WhatsApp Cloud API Setup';
    } else if (url.includes('/automations')) {
      this.currentRouteKey = 'automations';
      this.sectionLabel = 'Integrations';
      this.pageTitle = 'Automated Workflows';
    } else if (url.includes('/reports')) {
      this.currentRouteKey = 'reports';
      this.sectionLabel = 'Insights';
      this.pageTitle = 'Reports & Analytics';
    } else if (url.includes('/subscriptions')) {
      this.currentRouteKey = 'subscriptions';
      this.sectionLabel = 'Billing';
      this.pageTitle = 'Subscription Plans';
    } else if (url.includes('/settings')) {
      this.currentRouteKey = 'settings';
      this.sectionLabel = 'Administration';
      this.pageTitle = 'Workspace Settings';
    } else if (url.includes('/admin')) {
      this.currentRouteKey = 'admin';
      this.sectionLabel = 'Administration';
      this.pageTitle = 'Super Admin Platform';
    } else {
      this.currentRouteKey = 'dashboard';
      this.sectionLabel = 'Operations';
      this.pageTitle = 'Executive Dashboard';
    }
  }

  toggleTheme(): void {
    // Theme toggle indicator
  }

  logout(): void {
    this.authService.logout();
  }
}
