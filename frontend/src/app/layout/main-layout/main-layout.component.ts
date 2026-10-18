import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AssistantPanelComponent } from '../assistant-panel/assistant-panel.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { SubscriptionService } from '../../core/services/subscription.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent, AssistantPanelComponent, ConfirmDialogComponent],
  template: `
    <div class="layout-container">
      <app-sidebar></app-sidebar>
      <app-assistant-panel></app-assistant-panel>
      <div class="main-wrapper">
        <app-topbar></app-topbar>

        <!-- Trial notices hidden on Live Inbox so messaging stays focused -->
        <div *ngIf="!hideTrialBanner() && subscription() as sub" class="trial-banner-container">
          <!-- Expired Trial Alert -->
          <div *ngIf="sub.isTrial && sub.isTrialExpired" class="trial-banner expired">
            <div class="banner-left">
              <span class="banner-icon">⚠️</span>
              <span class="banner-text">
                <strong>Your free trial has ended.</strong> Please upgrade your plan to continue using premium features.
              </span>
            </div>
            <a routerLink="/subscriptions" class="btn-upgrade-banner">Upgrade Plan</a>
          </div>

          <!-- Active Trial Warning (<= 3 days) -->
          <div *ngIf="sub.isTrial && !sub.isTrialExpired && (sub.daysRemaining ?? 0) <= 3" class="trial-banner warning">
            <div class="banner-left">
              <span class="banner-icon">⏳</span>
              <div class="banner-info">
                <span class="banner-title">
                  Free Trial Ending Soon: <strong>{{ sub.daysRemaining }} {{ (sub.daysRemaining === 1) ? 'day' : 'days' }} remaining</strong>
                </span>
                <div class="usage-pills">
                  <span class="usage-pill">Staff: {{ sub.staffCount ?? 0 }}/{{ sub.staffLimit ?? 2 }}</span>
                  <span class="usage-pill">Customers: {{ sub.customerCount ?? 0 }}/{{ sub.customerLimit ?? 5 }}</span>
                  <span class="usage-pill">AI Chats Today: {{ sub.aiTodayChats ?? 0 }}/{{ sub.aiTodayLimit ?? 10 }}</span>
                </div>
              </div>
            </div>
            <a routerLink="/subscriptions" class="btn-upgrade-banner btn-warning">Upgrade Plan</a>
          </div>

          <!-- Active Trial Normal (> 3 days) -->
          <div *ngIf="sub.isTrial && !sub.isTrialExpired && (sub.daysRemaining ?? 0) > 3" class="trial-banner info">
            <div class="banner-left">
              <span class="banner-icon">✨</span>
              <div class="banner-info">
                <span class="banner-title">
                  Free Trial Active: <strong>{{ sub.daysRemaining }} days remaining</strong>
                </span>
                <div class="usage-pills">
                  <span class="usage-pill">Staff: {{ sub.staffCount ?? 0 }}/{{ sub.staffLimit ?? 2 }}</span>
                  <span class="usage-pill">Customers: {{ sub.customerCount ?? 0 }}/{{ sub.customerLimit ?? 5 }}</span>
                  <span class="usage-pill">AI Chats Today: {{ sub.aiTodayChats ?? 0 }}/{{ sub.aiTodayLimit ?? 10 }}</span>
                </div>
              </div>
            </div>
            <a routerLink="/subscriptions" class="btn-upgrade-banner btn-info">Upgrade Plan</a>
          </div>
        </div>

        <main class="page-content" [class.inbox-page-pad]="hideTrialBanner()">
          <router-outlet></router-outlet>
        </main>

        <!-- Mobile Bottom Navigation (Visible only on mobile screens <= 768px) -->
        <nav class="mobile-bottom-nav">
          <a routerLink="/inbox" routerLinkActive="active" class="mobile-nav-item">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Inbox</span>
          </a>
          <a routerLink="/appointments" routerLinkActive="active" class="mobile-nav-item">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
              <line x1="16" x2="16" y1="2" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="19" y2="10"></line>
            </svg>
            <span>Appointments</span>
          </a>
          <a routerLink="/customers" routerLinkActive="active" class="mobile-nav-item">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Customers</span>
          </a>
          <a routerLink="/settings" routerLinkActive="active" class="mobile-nav-item">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Settings</span>
          </a>
        </nav>
      </div>
      <app-confirm-dialog></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background-color: var(--slate-50);
    }

    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      min-width: 0;
      overflow: hidden;
    }

    .trial-banner-container {
      padding: 0.5rem 1rem 0;
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;
    }

    .trial-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 1rem;
      border-radius: 10px;
      font-size: 0.825rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      gap: 1rem;
    }

    .trial-banner.expired {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .trial-banner.warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }

    .trial-banner.info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }

    .banner-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .banner-icon {
      font-size: 1.15rem;
      line-height: 1;
    }

    .banner-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .banner-title {
      font-weight: 500;
    }

    .usage-pills {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .usage-pill {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.08);
      white-space: nowrap;
    }

    .btn-upgrade-banner {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.85rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.15s ease;
      background: #dc2626;
      color: #ffffff;
    }

    .btn-upgrade-banner:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn-upgrade-banner.btn-warning {
      background: #d97706;
      color: #ffffff;
    }

    .btn-upgrade-banner.btn-info {
      background: #2563eb;
      color: #ffffff;
    }

    .page-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0.75rem 1rem;
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    /* Live Inbox: tighter pad so chat uses more height */
    .page-content.inbox-page-pad {
      overflow: hidden;
      padding: 0.35rem 0.65rem;
    }

    .page-content.inbox-page-pad > * {
      flex: 1;
      min-height: 0;
    }

    .page-content::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .page-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .page-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 9999px;
    }

    .page-content::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .mobile-bottom-nav {
      display: none;
    }

    @media (max-width: 768px) {
      app-sidebar {
        display: none !important;
      }
      .page-content {
        padding: 0.5rem 0.6rem calc(72px + env(safe-area-inset-bottom, 0px));
        max-width: none;
      }
      .page-content.inbox-page-pad {
        padding: 0 0 calc(64px + env(safe-area-inset-bottom, 0px));
      }
      .trial-banner-container {
        padding: 0.4rem 0.6rem 0;
        max-width: none;
      }
      .trial-banner {
        flex-direction: column;
        align-items: stretch;
        gap: 0.55rem;
        padding: 0.7rem 0.85rem;
      }
      .banner-left {
        width: 100%;
      }
      .btn-upgrade-banner {
        width: 100%;
        justify-content: center;
        padding: 0.55rem 0.85rem;
      }
      .usage-pills {
        width: 100%;
      }
      .mobile-bottom-nav {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: calc(60px + env(safe-area-inset-bottom, 0px));
        padding-bottom: env(safe-area-inset-bottom, 0px);
        background: #0b1329;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 999;
        justify-content: space-around;
        align-items: center;
        box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.35);
      }
      .mobile-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        color: #94a3b8;
        text-decoration: none;
        font-size: 0.7rem;
        font-weight: 600;
        padding: 8px 10px;
        min-width: 64px;
        border-radius: 10px;
        transition: all 0.15s ease;
        -webkit-tap-highlight-color: transparent;
      }
      .mobile-nav-item svg {
        width: 22px;
        height: 22px;
      }
      .mobile-nav-item.active {
        color: #60a5fa;
        background: rgba(96, 165, 250, 0.12);
      }
      .mobile-nav-item.active svg {
        stroke: #60a5fa;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);
  subscription = this.subscriptionService.currentSubscription;

  private readonly urlPath = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly hideTrialBanner = computed(() => (this.urlPath() || '').startsWith('/inbox'));

  ngOnInit(): void {
    this.subscriptionService.refreshSubscription();
  }
}

