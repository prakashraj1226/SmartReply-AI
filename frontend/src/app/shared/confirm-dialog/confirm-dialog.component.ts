import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="dialogService.isOpen()" class="confirm-backdrop" (click)="onBackdropClick($event)">
      <div class="confirm-card" (click)="$event.stopPropagation()">
        <!-- Icon Badge -->
        <div class="icon-circle" [ngClass]="dialogService.options()?.type || 'danger'">
          <!-- Danger Icon -->
          <svg *ngIf="(dialogService.options()?.type || 'danger') === 'danger'" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>

          <!-- Warning Icon -->
          <svg *ngIf="dialogService.options()?.type === 'warning'" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>

          <!-- Info Icon -->
          <svg *ngIf="dialogService.options()?.type === 'info'" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>

          <!-- Success Icon -->
          <svg *ngIf="dialogService.options()?.type === 'success'" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>

        <!-- Content -->
        <h3 class="confirm-title">{{ dialogService.options()?.title }}</h3>
        <p class="confirm-message">{{ dialogService.options()?.message }}</p>

        <!-- Role warning banner if non-owner tries to upgrade -->
        <div *ngIf="upgradeNotice()" class="upgrade-role-warning">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ upgradeNotice() }}</span>
        </div>

        <!-- Actions -->
        <div class="confirm-actions" [class.single-action]="!dialogService.options()?.cancelText && !dialogService.options()?.showUpgrade">
          <button
            *ngIf="dialogService.options()?.cancelText"
            type="button"
            class="btn-cancel"
            (click)="onCancel()"
          >
            {{ dialogService.options()?.cancelText }}
          </button>
          <button
            type="button"
            class="btn-confirm"
            [ngClass]="dialogService.options()?.type || 'danger'"
            (click)="onConfirm()"
          >
            {{ dialogService.options()?.confirmText || 'Got It' }}
          </button>
          <button
            *ngIf="dialogService.options()?.showUpgrade"
            type="button"
            class="btn-upgrade"
            (click)="onUpgradeClick()"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {{ dialogService.options()?.upgradeText || 'Upgrade Plan' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-backdrop {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 1.5rem;
      box-sizing: border-box;
      animation: backdropFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes backdropFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .confirm-card {
      background: #ffffff;
      border-radius: 24px;
      width: 100%;
      max-width: 440px;
      padding: 2.2rem 1.85rem 1.85rem;
      text-align: center;
      box-shadow:
        0 24px 50px -10px rgba(15, 23, 42, 0.38),
        0 0 0 1px rgba(226, 232, 240, 0.9);
      animation: cardPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    @keyframes cardPopIn {
      from {
        opacity: 0;
        transform: scale(0.92) translateY(14px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    /* Icon Circle */
    .icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      margin: 0 auto 1.4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .confirm-card:hover .icon-circle {
      transform: scale(1.05) rotate(-2deg);
    }

    .icon-circle.danger {
      background: #fef2f2;
      color: #ef4444;
      border: 1.5px solid #fee2e2;
    }

    .icon-circle.warning {
      background: #fffbeb;
      color: #f59e0b;
      border: 1.5px solid #fef3c7;
    }

    .icon-circle.info {
      background: #eff6ff;
      color: #3b82f6;
      border: 1.5px solid #dbeafe;
    }

    .icon-circle.success {
      background: #ecfdf5;
      color: #10b981;
      border: 1.5px solid #d1fae5;
    }

    /* Typography */
    .confirm-title {
      font-size: 1.28rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.65rem;
      letter-spacing: -0.02em;
    }

    .confirm-message {
      font-size: 0.94rem;
      line-height: 1.55;
      color: #64748b;
      margin: 0 0 1.6rem;
      padding: 0 0.5rem;
      white-space: pre-line;
    }

    /* Role warning banner */
    .upgrade-role-warning {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      margin-bottom: 1.2rem;
      color: #991b1b;
      font-size: 0.85rem;
      font-weight: 500;
      line-height: 1.4;
      text-align: left;
      animation: alertFadeIn 0.2s ease;
    }

    .upgrade-role-warning svg {
      flex-shrink: 0;
      color: #dc2626;
    }

    @keyframes alertFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Actions */
    .confirm-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }

    .confirm-actions > button {
      flex: 1 1 130px;
    }

    .confirm-actions.single-action {
      max-width: 200px;
      margin: 0 auto;
    }

    .confirm-actions.single-action > button {
      flex: 1;
    }

    .btn-cancel {
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #475569;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }

    .btn-cancel:hover {
      background: #f1f5f9;
      color: #1e293b;
      border-color: #cbd5e1;
    }

    .btn-confirm {
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 700;
      color: #ffffff;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }

    .btn-confirm.danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 6px 18px -4px rgba(239, 68, 68, 0.4);
    }

    .btn-confirm.danger:hover {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      box-shadow: 0 8px 22px -4px rgba(239, 68, 68, 0.5);
      transform: translateY(-1px);
    }

    .btn-confirm.warning {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      box-shadow: 0 6px 18px -4px rgba(245, 158, 11, 0.4);
    }

    .btn-confirm.warning:hover {
      background: linear-gradient(135deg, #d97706, #b45309);
      box-shadow: 0 8px 22px -4px rgba(245, 158, 11, 0.5);
      transform: translateY(-1px);
    }

    .btn-confirm.info {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      box-shadow: 0 6px 18px -4px rgba(59, 130, 246, 0.4);
    }

    .btn-confirm.info:hover {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      box-shadow: 0 8px 22px -4px rgba(59, 130, 246, 0.5);
      transform: translateY(-1px);
    }

    .btn-confirm.success {
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 6px 18px -4px rgba(16, 185, 129, 0.4);
    }

    .btn-confirm.success:hover {
      background: linear-gradient(135deg, #059669, #047857);
      box-shadow: 0 8px 22px -4px rgba(16, 185, 129, 0.5);
      transform: translateY(-1px);
    }

    /* Upgrade Button */
    .btn-upgrade {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 700;
      color: #ffffff;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      border: none;
      cursor: pointer;
      box-shadow: 0 6px 18px -4px rgba(37, 99, 235, 0.4);
      transition: all 0.15s ease-in-out;
    }

    .btn-upgrade:hover {
      background: linear-gradient(135deg, #1d4ed8, #1e40af);
      box-shadow: 0 8px 22px -4px rgba(37, 99, 235, 0.5);
      transform: translateY(-1px);
    }

    .btn-confirm:active, .btn-cancel:active, .btn-upgrade:active {
      transform: translateY(0);
    }
  `]
})
export class ConfirmDialogComponent {
  dialogService = inject(ConfirmDialogService);
  authService = inject(AuthService);
  router = inject(Router);

  upgradeNotice = signal<string | null>(null);

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.dialogService.isOpen()) {
      this.upgradeNotice.set(null);
      this.dialogService.close(false);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.upgradeNotice.set(null);
      this.dialogService.close(false);
    }
  }

  onConfirm(): void {
    this.upgradeNotice.set(null);
    this.dialogService.close(true);
  }

  onCancel(): void {
    this.upgradeNotice.set(null);
    this.dialogService.close(false);
  }

  onUpgradeClick(): void {
    if (this.authService.canManageBilling()) {
      this.upgradeNotice.set(null);
      this.dialogService.close(false);
      this.router.navigate(['/subscriptions']);
    } else {
      this.upgradeNotice.set('Only the business owner can manage billing and upgrade plans. Please contact your workspace administrator.');
    }
  }
}
