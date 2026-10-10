import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <div class="connection-pill">
          <span class="status-dot"></span>
          <span class="status-text">Sandbox Mode Active</span>
        </div>
      </div>

      <div class="topbar-right">
        <!-- Quick Setup Link -->
        <a routerLink="/onboarding" class="setup-btn" *ngIf="!authService.onboardingCompleted()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 14 14"></polyline>
          </svg>
          Complete Setup
        </a>

        <!-- User Profile Dropdown -->
        <div class="user-menu" *ngIf="authService.currentUser() as user">
          <div class="user-avatar">
            {{ user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div class="user-meta">
            <span class="user-name">{{ user.fullName }}</span>
            <span class="user-role">{{ user.role.replace('_', ' ') }}</span>
          </div>
          <button class="logout-btn" (click)="logout()" title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
      height: 64px;
      background: #ffffff;
      border-bottom: 1px solid var(--slate-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 30;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .connection-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      padding: 0.3125rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-700);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--wa-green-500);
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .setup-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: var(--warning-bg);
      color: var(--warning-text);
      border: 1px solid var(--warning-border);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-full);
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .setup-btn:hover {
      background: #fef3c7;
    }

    .setup-btn svg {
      width: 14px;
      height: 14px;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      color: #ffffff;
      font-weight: 700;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
    }

    .user-meta {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-900);
    }

    .user-role {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--slate-500);
      text-transform: capitalize;
    }

    .logout-btn {
      background: transparent;
      border: none;
      color: var(--slate-400);
      cursor: pointer;
      padding: 0.375rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      margin-left: 0.5rem;
    }

    .logout-btn:hover {
      color: var(--danger-text);
      background: var(--danger-bg);
    }

    .logout-btn svg {
      width: 18px;
      height: 18px;
    }
  `]
})
export class TopbarComponent {
  authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
