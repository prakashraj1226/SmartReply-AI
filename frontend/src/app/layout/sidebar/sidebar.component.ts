import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed">
      <!-- Brand Header -->
      <div class="sidebar-header">
        <div class="brand-logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M8 10h.01"></path>
              <path d="M12 10h.01"></path>
              <path d="M16 10h.01"></path>
            </svg>
          </div>
          <div class="brand-text" *ngIf="!isCollapsed">
            <span class="brand-name">SmartReply</span>
            <span class="brand-tag">AI</span>
          </div>
        </div>
      </div>

      <!-- Tenant Switcher / Indicator -->
      <div class="tenant-badge-box" *ngIf="!isCollapsed && authService.currentUser() as user">
        <div class="tenant-avatar">
          {{ user.businessName ? user.businessName.charAt(0).toUpperCase() : 'B' }}
        </div>
        <div class="tenant-info">
          <span class="tenant-title">{{ user.businessName || 'My Business' }}</span>
          <span class="tenant-plan">STARTER PLAN</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="nav-menu">
        <div class="nav-section-title" *ngIf="!isCollapsed">OPERATIONS</div>

        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="7" height="9" x="3" y="3" rx="1"></rect>
            <rect width="7" height="5" x="14" y="3" rx="1"></rect>
            <rect width="7" height="9" x="14" y="12" rx="1"></rect>
            <rect width="7" height="5" x="3" y="16" rx="1"></rect>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">Dashboard</span>
        </a>

        <a routerLink="/inbox" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7"></path>
            <path d="M22 13a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4"></path>
            <path d="M12 17v4"></path>
            <path d="M8 21h8"></path>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">Inbox</span>
          <span class="nav-badge" *ngIf="!isCollapsed">Live</span>
        </a>

        <a routerLink="/knowledge-base" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
            <path d="M6 6h10"></path>
            <path d="M6 10h10"></path>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">FAQ Knowledge</span>
        </a>

        <a routerLink="/appointments" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
            <line x1="16" x2="16" y1="2" y2="6"></line>
            <line x1="8" x2="8" y1="2" y2="6"></line>
            <line x1="3" x2="19" y1="10" y2="10"></line>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">Appointments</span>
        </a>

        <a routerLink="/customers" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">Customers</span>
        </a>

        <div class="nav-section-title" *ngIf="!isCollapsed">INTEGRATIONS & CONFIG</div>

        <a routerLink="/whatsapp" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon wa-color" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">WhatsApp API</span>
        </a>

        <a routerLink="/automations" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">Automations</span>
        </a>

        <a routerLink="/reports" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">Reports</span>
        </a>

        <a routerLink="/subscriptions" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="20" height="14" x="2" y="5" rx="2"></rect>
            <line x1="2" x2="22" y1="10" y2="10"></line>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">Billing & Plans</span>
        </a>

        <a routerLink="/settings" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">Settings</span>
        </a>

        <div class="nav-section-title" *ngIf="!isCollapsed && authService.isSuperAdmin()">ADMINISTRATION</div>

        <a routerLink="/admin" routerLinkActive="active" class="nav-item nav-item-admin" *ngIf="authService.isSuperAdmin()">
          <svg class="nav-icon admin-color" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">Super Admin</span>
        </a>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <button class="collapse-btn" (click)="toggleCollapse()" [title]="isCollapsed ? 'Expand' : 'Collapse'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline [attr.points]="isCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'"></polyline>
          </svg>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #1e293b;
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .sidebar.collapsed {
      width: 80px;
    }

    .sidebar-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #1e293b;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
      flex-shrink: 0;
    }

    .logo-icon svg {
      width: 22px;
      height: 22px;
    }

    .brand-text {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .brand-name {
      font-size: 1.125rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #ffffff;
    }

    .brand-tag {
      font-size: 0.6875rem;
      font-weight: 800;
      background: rgba(37, 99, 235, 0.2);
      color: #60a5fa;
      border: 1px solid rgba(96, 165, 250, 0.3);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
    }

    .tenant-badge-box {
      margin: 1rem 1.25rem 0.5rem;
      padding: 0.75rem;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .tenant-avatar {
      width: 32px;
      height: 32px;
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .tenant-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .tenant-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tenant-plan {
      font-size: 0.625rem;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 0.05em;
    }

    .nav-menu {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow-y: auto;
    }

    .nav-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
      padding: 0.75rem 0.75rem 0.375rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      color: #94a3b8;
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #f8fafc;
    }

    .nav-item.active {
      background: #2563eb;
      color: #ffffff;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .wa-color {
      color: #22c55e;
    }

    .nav-item.active .wa-color {
      color: #ffffff;
    }

    .nav-badge {
      margin-left: auto;
      font-size: 0.6875rem;
      font-weight: 700;
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
      border: 1px solid rgba(74, 222, 128, 0.3);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #1e293b;
      display: flex;
      justify-content: flex-end;
    }

    .collapse-btn {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 0.375rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease;
    }

    .collapse-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
    }

    .collapse-btn svg {
      width: 18px;
      height: 18px;
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
  isCollapsed = false;

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
}
