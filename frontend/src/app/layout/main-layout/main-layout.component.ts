import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

        <!-- PERSISTENT TRIAL NOTICES -->
        <div *ngIf="subscription() as sub" class="trial-banner-container">
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

        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
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

    @media (max-width: 768px) {
      .page-content {
        padding: 1rem;
      }
      .trial-banner {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  subscription = this.subscriptionService.currentSubscription;

  ngOnInit(): void {
    this.subscriptionService.refreshSubscription();
  }
}

