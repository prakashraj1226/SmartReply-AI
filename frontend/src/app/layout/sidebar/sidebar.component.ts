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
      <!-- Brand Header (Matching Reference 4 & 5) -->
      <div class="sidebar-header">
        <a routerLink="/dashboard" class="brand-logo">
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
        </a>
      </div>

      <!-- Tenant Switcher Card -->
      <div class="tenant-badge-box" *ngIf="!isCollapsed && authService.currentUser() as user">
        <div class="tenant-avatar">
          {{ user.businessName ? user.businessName.charAt(0).toUpperCase() : 'B' }}
        </div>
        <div class="tenant-info">
          <span class="tenant-title">{{ user.businessName || 'SmileCare Clinic' }}</span>
          <span class="tenant-plan">STARTER PLAN</span>
        </div>
      </div>

      <!-- Navigation Links with Reference 4 & 5 Styling -->
      <nav class="nav-menu">
        <div class="nav-section-title" *ngIf="!isCollapsed">OPERATIONS</div>

        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="7" height="9" x="3" y="3" rx="1.5"></rect>
            <rect width="7" height="5" x="14" y="3" rx="1.5"></rect>
            <rect width="7" height="9" x="14" y="12" rx="1.5"></rect>
            <rect width="7" height="5" x="3" y="16" rx="1.5"></rect>
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
          <span class="nav-label" *ngIf="!isCollapsed">Live Inbox</span>
          <span class="nav-badge" *ngIf="!isCollapsed">Live</span>
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

        <div class="nav-section-title" *ngIf="!isCollapsed">INSIGHTS & TRAINING</div>

        <a routerLink="/knowledge-base" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
            <path d="M6 6h10"></path>
            <path d="M6 10h10"></path>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">Knowledge FAQs</span>
        </a>

        <a routerLink="/reports" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">Reports & MRR</span>
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

        <a routerLink="/subscriptions" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="20" height="14" x="2" y="5" rx="2"></rect>
            <line x1="2" x2="22" y1="10" y2="10"></line>
          </svg>
          <span class="nav-label" *ngIf="!isCollapsed">Billing & Plans</span>
        </a>

        <a routerLink="/settings" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
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

      <!-- Bottom Status Pill & User Card (Exact Reference 4 & 5) -->
      <div class="sidebar-bottom-panel" *ngIf="!isCollapsed">
        <!-- AI Engine Status Pill -->
        <div class="ai-assistant-pill">
          <div class="ai-pill-left">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>AI Assistant</span>
          </div>
          <span class="ai-pill-count">24/7</span>
        </div>

        <!-- User Profile Card in Sidebar -->
        <div class="sidebar-user-card" *ngIf="authService.currentUser() as user">
          <div class="user-avatar-sm">
            {{ user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div class="user-info-sm">
            <span class="user-name-sm">{{ user.fullName }}</span>
            <span class="user-role-sm">{{ user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Business Owner' }}</span>
          </div>
          <button type="button" class="logout-btn-sm" (click)="authService.logout()" title="Logout">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" x2="9" y1="12" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 220px;
      height: 100vh;
      background: #0b1329;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .sidebar.collapsed {
      width: 68px;
    }

    .sidebar-header {
      padding: 0.75rem 0.85rem 0.65rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
    }

    .logo-icon {
      width: 30px;
      height: 30px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 3px 10px rgba(37, 99, 235, 0.45);
      flex-shrink: 0;
    }

    .logo-icon svg {
      width: 17px;
      height: 17px;
    }

    .brand-text {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .brand-name {
      font-size: 1rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #ffffff;
    }

    .brand-tag {
      font-size: 0.6rem;
      font-weight: 800;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #ffffff;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }

    .tenant-badge-box {
      margin: 0.4rem 0.65rem 0.15rem;
      padding: 0.4rem 0.6rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tenant-avatar {
      width: 26px;
      height: 26px;
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .tenant-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .tenant-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tenant-plan {
      font-size: 0.55rem;
      font-weight: 800;
      color: #60a5fa;
      letter-spacing: 0.05em;
    }

    .nav-menu {
      flex: 1;
      padding: 0.4rem 0.55rem;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      overflow-y: auto;
    }

    .nav-section-title {
      font-size: 0.6rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.07em;
      padding: 0.5rem 0.5rem 0.2rem;
      text-transform: uppercase;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.4rem 0.55rem;
      color: #94a3b8;
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #f8fafc;
    }

    /* Active Glowing Blue Pill (Signature from Reference 4 & 5) */
    .nav-item.active {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      font-weight: 600;
      box-shadow: 0 3px 10px rgba(37, 99, 235, 0.4);
    }

    .nav-icon {
      width: 16px;
      height: 16px;
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
      font-size: 0.6rem;
      font-weight: 800;
      background: rgba(34, 197, 94, 0.25);
      color: #4ade80;
      border: 1px solid rgba(74, 222, 128, 0.35);
      padding: 0.05rem 0.35rem;
      border-radius: 9999px;
    }

    /* Bottom Panel (Reference 4 & 5) */
    .sidebar-bottom-panel {
      padding: 0.45rem 0.65rem 0.55rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      background: rgba(0, 0, 0, 0.15);
    }

    .ai-assistant-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(37, 99, 235, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 0.3rem 0.55rem;
      border-radius: 9999px;
      color: #93c5fd;
      font-size: 0.6875rem;
      font-weight: 700;
    }

    .ai-pill-left {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .ai-pill-left svg {
      color: #60a5fa;
      width: 13px;
      height: 13px;
    }

    .ai-pill-count {
      background: #2563eb;
      color: #ffffff;
      padding: 0.05rem 0.35rem;
      border-radius: 9999px;
      font-size: 0.6rem;
      font-weight: 800;
    }

    .sidebar-user-card {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.5rem;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .user-avatar-sm {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.725rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-info-sm {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex: 1;
    }

    .user-name-sm {
      font-size: 0.75rem;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role-sm {
      font-size: 0.6rem;
      color: #94a3b8;
    }

    .logout-btn-sm {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease;
    }

    .logout-btn-sm:hover {
      color: #ef4444;
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
