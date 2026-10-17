import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionService, SubscriptionDetails, SubscriptionPlan, CheckoutOrder, VerifyPaymentRequest } from '../../core/services/subscription.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="subscriptions-page">

      <!-- 1. Glowing Hero Gradient Card (Reference 4 & 5 Style) -->
      <div class="hero-banner-card">
        <div class="hero-banner-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>SAAS SUBSCRIPTION, TIERS & BILLING</span>
          </div>
          <h1 class="hero-title">Billing, Plans & WhatsApp Allowances</h1>
          <p class="hero-subtitle">
            Manage your clinic subscription tier, WhatsApp conversation allowances, transaction invoices, and payment gateway.
          </p>
        </div>
        <div class="hero-actions">
          <div class="plan-status-pill">
            <span class="plan-dot"></span>
            <span>{{ subscription()?.status || 'ACTIVE' }}</span>
          </div>
        </div>
      </div>

      <!-- TRIAL SPECIFIC NOTICE BANNER -->
      <div *ngIf="subscription()?.isTrial" class="trial-page-banner" [class.expired]="subscription()?.isTrialExpired" [class.warning]="!subscription()?.isTrialExpired && (subscription()?.daysRemaining ?? 0) <= 3">
        <div class="trial-banner-left">
          <span class="trial-badge-icon" *ngIf="subscription()?.isTrialExpired">⚠️</span>
          <span class="trial-badge-icon" *ngIf="!subscription()?.isTrialExpired && (subscription()?.daysRemaining ?? 0) <= 3">⏳</span>
          <span class="trial-badge-icon" *ngIf="!subscription()?.isTrialExpired && (subscription()?.daysRemaining ?? 0) > 3">✨</span>
          <div class="trial-banner-copy">
            <span *ngIf="subscription()?.isTrialExpired" class="trial-msg">
              <strong>Your free trial has ended.</strong> Please upgrade your plan to continue using premium features.
            </span>
            <span *ngIf="!subscription()?.isTrialExpired && (subscription()?.daysRemaining ?? 0) <= 3" class="trial-msg">
              <strong>Free Trial Ending Soon:</strong> Only {{ subscription()?.daysRemaining }} {{ subscription()?.daysRemaining === 1 ? 'day' : 'days' }} remaining. Upgrade your plan before the trial ends.
            </span>
            <span *ngIf="!subscription()?.isTrialExpired && (subscription()?.daysRemaining ?? 0) > 3" class="trial-msg">
              <strong>Free Trial Active:</strong> You have {{ subscription()?.daysRemaining }} days remaining in your 14-day trial.
            </span>
          </div>
        </div>
        <button type="button" class="btn-trial-upgrade" (click)="scrollToPlans()">Upgrade Plan</button>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row (Trial Account Version) -->
      <div class="kpi-grid" *ngIf="subscription()?.isTrial">
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator" [class.green]="!subscription()?.isTrialExpired" [class.red]="subscription()?.isTrialExpired"></span>
              <span class="kpi-label">CURRENT TIER</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                <line x1="2" x2="22" y1="10" y2="10"></line>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ subscription()?.isTrialExpired ? 'Trial Expired' : 'Free Trial' }}</div>
          <div class="kpi-subtext">{{ subscription()?.isTrialExpired ? '14-day trial ended' : ((subscription()?.daysRemaining ?? 0) + ' days remaining') }}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator blue"></span>
              <span class="kpi-label">STAFF SEATS</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ subscription()?.staffCount ?? 0 }} / {{ subscription()?.staffLimit ?? 2 }}</div>
          <div class="kpi-subtext">Invited staff members (Owner excluded)</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator green"></span>
              <span class="kpi-label">CUSTOMERS</span>
            </div>
            <div class="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ subscription()?.customerCount ?? 0 }} / {{ subscription()?.customerLimit ?? 5 }}</div>
          <div class="kpi-subtext">Verified customer profiles</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">AI ASSISTANT TODAY</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ subscription()?.aiTodayChats ?? 0 }} / {{ subscription()?.aiTodayLimit ?? 10 }}</div>
          <div class="kpi-subtext">Side chat questions (Resets midnight IST)</div>
        </div>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row (Paid Account Version) -->
      <div class="kpi-grid" *ngIf="!subscription()?.isTrial">
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator blue"></span>
              <span class="kpi-label">CURRENT TIER</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                <line x1="2" x2="22" y1="10" y2="10"></line>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ subscription()?.planName || 'No plan' }}</div>
          <div class="kpi-subtext">₹{{ priceInr() | number }} / month billing</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator green"></span>
              <span class="kpi-label">CONVERSATIONS USED</span>
            </div>
            <div class="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ conversationsUsed() | number }} / {{ conversationLimit() | number }}</div>
          <div class="kpi-subtext">{{ conversationsRemaining() | number }} remaining this cycle</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator amber"></span>
              <span class="kpi-label">CYCLE RENEWAL</span>
            </div>
            <div class="kpi-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ renewalDays() }} Days</div>
          <div class="kpi-subtext">{{ renewalLabel() }}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">AMOUNT PAID</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">₹{{ amountPaid() | number }}</div>
          <div class="kpi-subtext">Payments recorded for this business</div>
        </div>
      </div>

      <!-- ALERTS -->
      <div *ngIf="pendingReview() as waiting" class="alert-banner warning">
        <div class="alert-content">
          <span>Payment {{ waiting.referenceCode || waiting.utr }} for ₹{{ waiting.amountInr | number:'1.0-0' }} is waiting. {{ waiting.planName }} turns on only after the owner confirms the money in GPay or PhonePe.</span>
        </div>
      </div>

      <div *ngIf="alertMsg" class="alert-banner" [ngClass]="alertType">
        <div class="alert-content">
          <span class="alert-icon">✓</span>
          <span>{{ alertMsg }}</span>
        </div>
        <button class="alert-close" (click)="alertMsg = ''">✕</button>
      </div>

      <!-- 3. Current Usage Progress Card (Paid accounts: Monthly Quota; Trial accounts: Allowances summary) -->
      <div class="usage-overview-card" *ngIf="subscription() && !subscription()?.isTrial">
        <div class="usage-header-row">
          <div>
            <h3 class="usage-title">Monthly WhatsApp Customer Conversation Quota</h3>
            <p class="usage-sub">Count of customer inbox and WhatsApp chat threads created in the billing month</p>
          </div>
          <div class="usage-percent-badge">{{ getUsagePercentage() }}% Quota Consumed</div>
        </div>

        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill" [style.width.%]="getUsagePercentage()"></div>
        </div>

        <div class="usage-footer-row">
          <span><strong>{{ conversationsUsed() | number }}</strong> threads used</span>
          <span><strong>{{ conversationsRemaining() | number }}</strong> conversations remaining</span>
          <span>Max <strong>{{ conversationLimit() | number }}</strong> conversations/mo</span>
        </div>
      </div>

      <!-- 3. Current Usage Progress Card (Trial accounts: Limits Overview) -->
      <div class="usage-overview-card" *ngIf="subscription() && subscription()?.isTrial">
        <div class="usage-header-row">
          <div>
            <h3 class="usage-title">Free Trial Limits & Usage</h3>
            <p class="usage-sub">Real-time allowances during your 14-day Free Trial</p>
          </div>
          <div class="usage-percent-badge" [class.badge-expired]="subscription()?.isTrialExpired">
            {{ subscription()?.isTrialExpired ? 'Trial Expired' : ((subscription()?.daysRemaining ?? 0) + ' Days Left') }}
          </div>
        </div>

        <div class="trial-limits-grid">
          <div class="trial-limit-item">
            <span class="tli-label">Staff Members</span>
            <span class="tli-value"><strong>{{ subscription()?.staffCount ?? 0 }}</strong> / {{ subscription()?.staffLimit ?? 2 }}</span>
            <div class="mini-progress"><div class="mini-bar" [style.width.%]="calcPercent(subscription()?.staffCount, subscription()?.staffLimit)"></div></div>
          </div>
          <div class="trial-limit-item">
            <span class="tli-label">Customers</span>
            <span class="tli-value"><strong>{{ subscription()?.customerCount ?? 0 }}</strong> / {{ subscription()?.customerLimit ?? 5 }}</span>
            <div class="mini-progress"><div class="mini-bar" [style.width.%]="calcPercent(subscription()?.customerCount, subscription()?.customerLimit)"></div></div>
          </div>
          <div class="trial-limit-item">
            <span class="tli-label">Knowledge Base Entries</span>
            <span class="tli-value"><strong>{{ subscription()?.knowledgeCount ?? 0 }}</strong> / {{ subscription()?.knowledgeLimit ?? 2 }}</span>
            <div class="mini-progress"><div class="mini-bar" [style.width.%]="calcPercent(subscription()?.knowledgeCount, subscription()?.knowledgeLimit)"></div></div>
          </div>
          <div class="trial-limit-item">
            <span class="tli-label">FAQ Entries</span>
            <span class="tli-value"><strong>{{ subscription()?.faqCount ?? 0 }}</strong> / {{ subscription()?.faqLimit ?? 2 }}</span>
            <div class="mini-progress"><div class="mini-bar" [style.width.%]="calcPercent(subscription()?.faqCount, subscription()?.faqLimit)"></div></div>
          </div>
          <div class="trial-limit-item">
            <span class="tli-label">AI Assistant (Today)</span>
            <span class="tli-value"><strong>{{ subscription()?.aiTodayChats ?? 0 }}</strong> / {{ subscription()?.aiTodayLimit ?? 10 }}</span>
            <div class="mini-progress"><div class="mini-bar" [style.width.%]="calcPercent(subscription()?.aiTodayChats, subscription()?.aiTodayLimit)"></div></div>
          </div>
          <div class="trial-limit-item">
            <span class="tli-label">Gemini Bot Replies (Today)</span>
            <span class="tli-value"><strong>{{ subscription()?.geminiRepliesToday ?? 0 }}</strong> / {{ finiteLimit(subscription()?.geminiRepliesDailyLimit) ?? 50 }}</span>
            <div class="mini-progress"><div class="mini-bar" [style.width.%]="calcPercent(subscription()?.geminiRepliesToday, subscription()?.geminiRepliesDailyLimit)"></div></div>
          </div>
          <div class="trial-limit-item">
            <span class="tli-label">Appointments Today (Total)</span>
            <span class="tli-value"><strong>{{ subscription()?.appointmentTodayCount ?? 0 }}/{{ subscription()?.appointmentTodayLimit ?? 2 }}</strong> (Total: {{ subscription()?.appointmentTotalCount ?? 0 }}/{{ subscription()?.appointmentTotalLimit ?? 15 }})</span>
            <div class="mini-progress"><div class="mini-bar" [style.width.%]="calcPercent(subscription()?.appointmentTotalCount, subscription()?.appointmentTotalLimit)"></div></div>
          </div>
        </div>
      </div>

      <!-- 4. Plans Comparison Section -->
      <div class="plans-container">
        <div class="section-header-box">
          <h2 class="section-title">Available Subscription Plans</h2>
          <p class="section-subtitle">Scale your automated WhatsApp AI support as your customer volume grows</p>
        </div>

        <div class="plans-grid">
          <div
            *ngFor="let p of plans()"
            class="plan-card"
            [class.highlighted]="p.code === 'GROWTH'"
            [class.current-active]="p.code === subscription()?.planCode && !subscription()?.isTrial"
          >
            <div class="plan-card-header">
              <span *ngIf="p.code === 'GROWTH'" class="popular-badge">★ Most Popular</span>
              <h3 class="plan-name">{{ p.name }}</h3>
              <div class="price-box">
                <span class="currency">₹</span>
                <span class="amount">{{ p.priceInr }}</span>
                <span class="period">/month</span>
              </div>
              <p class="plan-desc">For growing clinics with high patient enquiry volume</p>
            </div>

            <ul class="features-list">
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span><strong>{{ p.maxConversationsMonthly | number }}</strong> Conversations / mo</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Up to <strong>{{ p.maxAgents }}</strong> Staff Agent {{ p.maxAgents === 1 ? 'seat' : 'seats' }}</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span><strong>{{ geminiMonthlyCap(p.code) | number }}</strong> Gemini bot replies / mo</span>
              </li>
              <!-- AI Assistant feature indicator -->
              <li *ngIf="p.code === 'STARTER'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span style="color: #ef4444; font-weight: 600;">AI Assistant Not Included</span>
              </li>
              <li *ngIf="p.code !== 'STARTER'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>AI Assistant Side Chat Included</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>{{ p.aiFeaturesEnabled ? 'AI FAQ Autonomous Grounding' : 'Basic Rule Engine & Auto-Replies' }}</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Official Meta WhatsApp Cloud API</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Appointment Scheduling & Reminders</span>
              </li>
              <li *ngIf="p.code === 'GROWTH' || p.code === 'PRO'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>AI Suggestions & Drafts in Live Inbox</span>
              </li>
              <li *ngIf="p.code === 'PRO'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Dedicated Technical Account Manager & 24/7 SLA</span>
              </li>
            </ul>

            <div class="plan-card-footer">
              <button
                *ngIf="p.code !== subscription()?.planCode || subscription()?.isTrial"
                class="btn-plan-action"
                [class.btn-popular]="p.code === 'GROWTH'"
                (click)="startCheckout(p.code)"
              >
                Upgrade to {{ p.name }}
              </button>
              <button *ngIf="p.code === subscription()?.planCode && !subscription()?.isTrial" class="btn-current-plan" disabled>
                ✓ Current Active Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Invoices & Billing History -->
      <div class="table-card">
        <div class="card-header-flex">
          <div class="table-title-box">
            <div class="table-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                <line x1="2" x2="22" y1="10" y2="10"></line>
              </svg>
            </div>
            <div>
              <h3 class="table-title">Invoices & Payment Receipts</h3>
              <p class="table-subtitle">Verified GST compliant invoices and Razorpay transactions</p>
            </div>
          </div>
          <span class="badge-audit">Auto-Receipts</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Date</th>
                <th>Plan Tier</th>
                <th>Amount (INR)</th>
                <th>Payment Gateway</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="!visibleTransactions().length">
                <td colspan="6">No payments recorded yet.</td>
              </tr>
              <tr *ngFor="let tx of visibleTransactions()">
                <td><strong>{{ tx.referenceCode || tx.utr || tx.paymentId || tx.id }}</strong></td>
                <td>{{ tx.createdAt | date:'mediumDate' }}</td>
                <td>{{ tx.planName || '—' }}</td>
                <td>₹{{ tx.amountInr | number }}</td>
                <td>{{ tx.gateway || '—' }}</td>
                <td><span [class]="paymentStatusClass(tx.status)">{{ paymentStatusLabel(tx.status) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- CHECKOUT MODAL -->
      <div *ngIf="showCheckoutModal && checkoutOrder" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-title-box">
              <div class="modal-icon-badge">💳</div>
              <div>
                <h3>Pay with UPI</h3>
                <p class="modal-subtitle">GPay or PhonePe. Money goes to this account.</p>
              </div>
            </div>
            <button class="close-btn" (click)="closeCheckoutModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="order-summary-box">
              <div class="summary-line">
                <span>Selected Plan:</span>
                <strong>{{ checkoutOrder.planCode }}</strong>
              </div>
              <div class="summary-line">
                <span>Monthly Recurring:</span>
                <span>₹{{ checkoutOrder.amountInr }}</span>
              </div>
              <div class="summary-line">
                <span>GST (18%):</span>
                <span>₹{{ (checkoutOrder.amountInr * 0.18).toFixed(0) }}</span>
              </div>
              <div class="summary-line total">
                <span>Total Amount Due:</span>
                <strong>₹{{ (checkoutOrder.amountInr * 1.18).toFixed(0) }}</strong>
              </div>
            </div>

            <div class="pay-methods">
              <button type="button" class="pay-method" *ngFor="let account of upiAccounts; let i = index" [class.active]="selectedUpiIndex === i" (click)="selectUpi(i)">
                {{ account.label }}
              </button>
            </div>

            <div class="upi-pay-box">
              <img *ngIf="upiQrUrl" [src]="upiQrUrl" alt="UPI QR code" class="upi-qr" />
              <div class="upi-id">{{ upiAccounts[selectedUpiIndex].upiId }}</div>
              <div class="upi-amount">Pay ₹{{ totalDue() }}</div>
              <div class="pay-code">Payment code {{ checkoutOrder.referenceCode }}</div>
              <a class="upi-open" [href]="upiPayLink()">Open in UPI app</a>
              <p class="upi-note">Pay this exact amount. The code {{ checkoutOrder.referenceCode }} is in the UPI note. Then enter the UPI reference from your app. The plan stays off until the owner confirms the money.</p>
              <label class="utr-label" for="upi-utr">UPI reference number</label>
              <input id="upi-utr" class="utr-input" name="utr" [(ngModel)]="utr" placeholder="From GPay or PhonePe" autocomplete="off" />
            </div>

            <p class="checkout-error" *ngIf="checkoutError">{{ checkoutError }}</p>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeCheckoutModal()">Cancel</button>
            <button class="btn-checkout-confirm" [disabled]="isProcessingPayment() || utr.trim().length < 6" (click)="confirmPayment()">
              <span *ngIf="!isProcessingPayment()">I have paid ₹{{ totalDue() }}</span>
              <span *ngIf="isProcessingPayment()" class="spinner-sm"></span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .subscriptions-page {
      padding: 0;
      background: transparent;
      min-height: auto;
    }

    /* 1. Hero Card */
    .hero-banner-card {
      background: radial-gradient(120% 140% at 88% 12%, rgba(59, 130, 246, 0.32) 0%, rgba(37, 99, 235, 0.16) 40%, transparent 70%),
                  radial-gradient(100% 100% at 12% 88%, rgba(99, 102, 241, 0.22) 0%, transparent 60%),
                  linear-gradient(135deg, #091326 0%, #0d2149 55%, #081024 100%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      padding: 0.95rem 1.4rem;
      min-height: 104px;
      color: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(11, 19, 41, 0.4), 0 2px 6px rgba(0, 0, 0, 0.15);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      box-sizing: border-box;
      margin-bottom: 0.85rem;
    }

    .hero-banner-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
      background-size: 16px 16px;
      opacity: 0.35;
      pointer-events: none;
    }

    .hero-banner-glow {
      position: absolute;
      top: -50px;
      right: -40px;
      width: 240px;
      height: 240px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      filter: blur(10px);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 650px;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.38rem;
      background: rgba(34, 197, 94, 0.14);
      border: 1px solid rgba(74, 222, 128, 0.32);
      backdrop-filter: blur(8px);
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      margin-bottom: 0.35rem;
      color: #4ade80;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 8px #4ade80;
      animation: pulseDot 2s infinite;
    }

    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .hero-title {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: #ffffff !important;
      margin: 0 0 0.25rem 0;
      line-height: 1.2;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
    }

    .hero-subtitle {
      font-size: 0.775rem;
      color: #cbd5e1;
      margin: 0;
      line-height: 1.4;
      max-width: 640px;
    }

    .plan-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(34, 197, 94, 0.2);
      border: 1px solid rgba(74, 222, 128, 0.4);
      color: #4ade80;
      padding: 0.4rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.725rem;
      font-weight: 800;
      letter-spacing: 0.03em;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
    }

    .plan-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 6px #4ade80;
    }

    /* 2. 4-Column Stat Cards Row */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-bottom: 0.85rem;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.75rem 0.95rem;
      box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.04), 0 1px 3px -1px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: transparent;
      transition: all 0.22s ease;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(37, 99, 235, 0.06);
      border-color: #cbd5e1;
    }

    .kpi-card:hover::before {
      background: linear-gradient(90deg, #3b82f6, #93c5fd);
    }

    .kpi-card.active-accent {
      border-color: #bfdbfe;
      box-shadow: 0 4px 14px -2px rgba(37, 99, 235, 0.14), 0 0 0 1px rgba(37, 99, 235, 0.15);
    }

    .kpi-card.active-accent::before {
      background: linear-gradient(90deg, #2563eb, #60a5fa);
    }

    .kpi-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.45rem;
    }

    .kpi-label-box {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .status-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .status-indicator.blue { background: #2563eb; box-shadow: 0 0 6px rgba(37, 99, 235, 0.5); }
    .status-indicator.green { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.5); }
    .status-indicator.amber { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }
    .status-indicator.purple { background: #8b5cf6; box-shadow: 0 0 6px rgba(139, 92, 246, 0.5); }

    .kpi-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .kpi-icon-box {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }

    .kpi-card:hover .kpi-icon-box {
      transform: scale(1.08);
    }

    .kpi-icon-box svg {
      width: 15px;
      height: 15px;
    }

    .kpi-icon-box.blue { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
    .kpi-icon-box.green { background: #f0fdf4; color: #059669; border: 1px solid #dcfce7; }
    .kpi-icon-box.amber { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
    .kpi-icon-box.purple { background: #faf5ff; color: #7c3aed; border: 1px solid #f3e8ff; }

    .kpi-number {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      line-height: 1.15;
      margin-bottom: 0.3rem;
    }

    .kpi-subtext {
      font-size: 0.6875rem;
      color: #64748b;
      font-weight: 500;
    }

    /* 3. Usage Overview Card */
    .usage-overview-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.85rem 1.15rem;
      box-shadow: 0 2px 10px -2px rgba(0,0,0,0.04);
      margin-bottom: 0.85rem;
    }

    .usage-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .usage-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .usage-sub {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0.15rem 0 0;
    }

    .usage-percent-badge {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #2563eb;
      font-size: 0.775rem;
      font-weight: 800;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
    }

    .progress-bar-wrapper {
      width: 100%;
      height: 10px;
      background: #f1f5f9;
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #2563eb);
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .usage-footer-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.775rem;
      color: #64748b;
    }

    .usage-footer-row strong {
      color: #0f172a;
    }

    /* 4. Plans Grid */
    .plans-container {
      margin-bottom: 1.75rem;
    }

    .section-header-box {
      margin-bottom: 1.25rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .section-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0.2rem 0 0;
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .plan-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.75rem 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .plan-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.07);
    }

    .plan-card.highlighted {
      border: 2px solid #2563eb;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.12);
    }

    .popular-badge {
      position: absolute;
      top: -12px;
      right: 20px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      text-transform: uppercase;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
    }

    .plan-card-header {
      margin-bottom: 1.25rem;
    }

    .plan-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.5rem;
    }

    .price-box {
      display: flex;
      align-items: baseline;
      gap: 0.15rem;
      margin-bottom: 0.5rem;
    }

    .currency {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
    }

    .amount {
      font-size: 2.25rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
    }

    .period {
      font-size: 0.85rem;
      color: #64748b;
    }

    .plan-desc {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
    }

    .features-list {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      flex: 1;
    }

    .features-list li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.825rem;
      color: #334155;
    }

    .plan-card-footer {
      margin-top: auto;
    }

    .btn-plan-action {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.85rem;
      font-weight: 700;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #0f172a;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-plan-action:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .btn-plan-action.btn-popular {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: none;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
    }

    .btn-plan-action.btn-popular:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.5);
    }

    .btn-current-plan {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.85rem;
      font-weight: 700;
      border-radius: 10px;
      border: 1px solid #a7f3d0;
      background: #ecfdf5;
      color: #065f46;
      cursor: default;
    }

    /* 5. Invoices Table Card */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    .card-header-flex {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .table-title-box {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .table-icon-badge {
      width: 38px;
      height: 38px;
      background: #eff6ff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
    }

    .table-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .table-subtitle {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0.15rem 0 0;
    }

    .badge-audit {
      font-size: 0.725rem;
      font-weight: 700;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th {
      padding: 0.85rem 1.25rem;
      background: #f8fafc;
      font-size: 0.725rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 0.95rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
      color: #334155;
    }

    .status-pill-green {
      background: #ecfdf5;
      color: #059669;
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      border: 1px solid #a7f3d0;
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(9, 19, 40, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
      box-sizing: border-box;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: 16px;
      width: min(480px, 100%);
      max-height: calc(100vh - 32px);
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: modalSlideUp 0.2s ease-out;
    }

    @keyframes modalSlideUp {
      from { transform: translateY(15px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      padding: 0.85rem 1.15rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .modal-title-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .modal-icon-badge {
      width: 36px;
      height: 36px;
      background: #eff6ff;
      color: #2563eb;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .modal-title-box h3 {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.15rem 0 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .modal-body {
      padding: 0.75rem 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      overflow-y: auto;
      min-height: 0;
    }

    .order-summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.7rem 0.85rem;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #475569;
      margin-bottom: 0.5rem;
    }

    .summary-line.total {
      border-top: 1px solid #e2e8f0;
      padding-top: 0.75rem;
      margin-top: 0.75rem;
      font-size: 1rem;
      color: #0f172a;
    }

    .pay-methods {
      display: flex;
      gap: 0.5rem;
      margin-top: 0;
    }

    .pay-method {
      flex: 1;
      border: 1px solid #cbd5e1;
      background: #fff;
      border-radius: 8px;
      padding: 0.55rem 0.75rem;
      font-weight: 700;
      color: #334155;
      cursor: pointer;
    }

    .pay-method.active {
      border-color: #2563eb;
      background: #eff6ff;
      color: #1d4ed8;
    }

    .upi-pay-box {
      margin-top: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      text-align: center;
    }

    .upi-qr {
      width: 132px;
      height: 132px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #fff;
    }

    .upi-id {
      font-weight: 800;
      font-size: 0.82rem;
      color: #0f172a;
      word-break: break-all;
    }

    .upi-amount {
      font-size: 1.05rem;
      font-weight: 800;
      color: #1d4ed8;
    }

    .upi-open {
      color: #2563eb;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .pay-code {
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: #0f172a;
    }

    .utr-label {
      align-self: stretch;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 700;
      color: #334155;
      margin-top: 0.35rem;
    }

    .utr-input {
      align-self: stretch;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.55rem 0.7rem;
      font-size: 0.9rem;
    }

    .upi-note {
      margin: 0.35rem 0 0;
      color: #64748b;
      font-size: 0.75rem;
      line-height: 1.4;
    }

    .checkout-error {
      margin: 0.75rem 0 0;
      color: #b91c1c;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .gateway-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      padding: 0.75rem 0.85rem;
      color: #065f46;
      font-size: 0.775rem;
      line-height: 1.4;
    }

    .modal-footer {
      padding: 0.75rem 1.15rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .btn-cancel {
      padding: 0.55rem 1rem;
      font-size: 0.825rem;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      border-radius: 8px;
      cursor: pointer;
    }

    .btn-checkout-confirm {
      padding: 0.55rem 1.25rem;
      font-size: 0.825rem;
      font-weight: 700;
      border: none;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }

    .btn-checkout-confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .status-pill-green {
      background: #ecfdf5;
      color: #059669;
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      border: 1px solid #a7f3d0;
    }

    .status-pill-amber {
      background: #fffbeb;
      color: #b45309;
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      border: 1px solid #fde68a;
    }

    .status-pill-red {
      background: #fef2f2;
      color: #b91c1c;
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      border: 1px solid #fecaca;
    }

    .trial-page-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      margin-bottom: 0.85rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      gap: 1rem;
    }

    .trial-page-banner.warning {
      background: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }

    .trial-page-banner.expired {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }

    .trial-banner-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .trial-badge-icon {
      font-size: 1.25rem;
      line-height: 1;
    }

    .trial-banner-copy {
      display: flex;
      flex-direction: column;
    }

    .trial-msg {
      font-size: 0.85rem;
      font-weight: 500;
    }

    .btn-trial-upgrade {
      display: inline-flex;
      align-items: center;
      padding: 0.4rem 1rem;
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 700;
      background: #2563eb;
      color: #ffffff;
      border: none;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .trial-page-banner.warning .btn-trial-upgrade {
      background: #d97706;
    }

    .trial-page-banner.expired .btn-trial-upgrade {
      background: #dc2626;
    }

    .btn-trial-upgrade:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .status-indicator.red {
      background: #ef4444;
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
    }

    .badge-expired {
      background: #fee2e2 !important;
      color: #b91c1c !important;
      border-color: #fecaca !important;
    }

    .trial-limits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.85rem;
      margin-top: 0.85rem;
    }

    .trial-limit-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.75rem 0.95rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .tli-label {
      font-size: 0.725rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .tli-value {
      font-size: 0.95rem;
      color: #0f172a;
    }

    .mini-progress {
      height: 6px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 0.2rem;
    }

    .mini-bar {
      height: 100%;
      background: linear-gradient(90deg, #2563eb, #38bdf8);
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .alert-banner.error {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }

    .alert-banner.warning {
      background: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }

    .alert-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .alert-close {
      background: none;
      border: none;
      cursor: pointer;
    }

    .spinner-sm {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SubscriptionsComponent implements OnInit {
  subscription = signal<SubscriptionDetails | null>(null);
  plans = signal<SubscriptionPlan[]>([]);

  showCheckoutModal = false;
  checkoutOrder: CheckoutOrder | null = null;
  isProcessingPayment = signal(false);

  alertMsg = '';
  alertType = 'success';
  checkoutError = '';
  upiAccounts = [
    { label: 'GPay', upiId: 'prakashrajkalamathavan@okicici' },
    { label: 'PhonePe', upiId: '9094460709@ybl' }
  ];
  selectedUpiIndex = 0;
  upiQrUrl = '';
  utr = '';

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.loadSubscription();
    this.loadPlans();
  }

  calcPercent(val?: number, max?: number): number {
    if (!max || max <= 0 || max >= 2147483647) return 0;
    return Math.min(100, Math.round(((val ?? 0) / max) * 100));
  }

  /** Hide Java Integer.MAX_VALUE caps in the UI. */
  finiteLimit(max?: number): number | null {
    if (max == null || max >= 2147483647) return null;
    return max;
  }

  geminiMonthlyCap(planCode?: string): number {
    switch ((planCode || '').toUpperCase()) {
      case 'STARTER': return 1000;
      case 'GROWTH': return 5000;
      case 'PRO': return 20000;
      default: return 0;
    }
  }

  scrollToPlans(): void {
    const el = document.querySelector('.plans-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  loadSubscription(): void {
    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (res) => {
        this.subscription.set(res.data || null);
      },
      error: () => {
        this.subscription.set(null);
      }
    });
  }

  loadPlans(): void {
    this.subscriptionService.getPlans().subscribe({
      next: (res) => {
        const available = (res.data || []).filter(p => p.code !== 'FREE' && p.code !== 'TRIAL');
        this.plans.set(available);
      },
      error: () => this.plans.set([])
    });
  }

  priceInr(): number {
    return this.subscription()?.priceInr ?? 0;
  }

  conversationsUsed(): number {
    return this.subscription()?.currentMonthConversations ?? 0;
  }

  conversationLimit(): number {
    return this.subscription()?.maxConversationsMonthly ?? 0;
  }

  conversationsRemaining(): number {
    return this.subscription()?.remainingConversations ?? 0;
  }

  renewalDays(): number {
    const end = this.subscription()?.currentPeriodEnd;
    if (!end) {
      return 0;
    }
    const remainingMs = new Date(end).getTime() - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 86_400_000));
  }

  renewalLabel(): string {
    const end = this.subscription()?.currentPeriodEnd;
    if (!end) {
      return 'No renewal date';
    }
    return `Next invoice on ${this.formatDate(end)}`;
  }

  amountPaid(): number {
    return (this.subscription()?.transactions || [])
      .filter(tx => (tx.status || '').toUpperCase() === 'SUCCESS')
      .reduce((sum, tx) => sum + Number(tx.amountInr || 0), 0);
  }

  getUsagePercentage(): number {
    const sub = this.subscription();
    if (!sub || !sub.maxConversationsMonthly) {
      return 0;
    }
    return Math.min(100, Math.round((sub.currentMonthConversations / sub.maxConversationsMonthly) * 100));
  }

  startCheckout(planCode: string): void {
    this.subscriptionService.createCheckoutOrder(planCode).subscribe({
      next: (res) => {
        this.checkoutError = '';
        this.resetPaymentForm();
        this.checkoutOrder = res.data;
        this.showCheckoutModal = true;
        this.refreshUpiQr();
      },
      error: () => {
        this.alertType = 'error';
        this.alertMsg = 'Could not start checkout for this plan.';
      }
    });
  }

  closeCheckoutModal(): void {
    this.showCheckoutModal = false;
    this.checkoutOrder = null;
    this.checkoutError = '';
    this.resetPaymentForm();
  }

  resetPaymentForm(): void {
    this.selectedUpiIndex = 0;
    this.upiQrUrl = '';
    this.utr = '';
  }

  totalDue(): number {
    const due = this.checkoutOrder?.amountDueInr;
    if (due != null) {
      return Math.round(Number(due));
    }
    return Math.round(Number(this.checkoutOrder?.amountInr || 0) * 1.18);
  }

  upiPayLink(): string {
    const account = this.upiAccounts[this.selectedUpiIndex];
    const params = new URLSearchParams({
      pa: account.upiId,
      pn: 'SmartReply',
      am: this.totalDue().toFixed(2),
      cu: 'INR',
      tn: this.checkoutOrder?.referenceCode || 'SmartReply'
    });
    return `upi://pay?${params.toString()}`;
  }

  selectUpi(index: number): void {
    this.selectedUpiIndex = index;
    this.refreshUpiQr();
  }

  refreshUpiQr(): void {
    import('qrcode').then((mod: { default?: { toDataURL: (text: string, options: object) => Promise<string> }; toDataURL?: (text: string, options: object) => Promise<string> }) => {
      const QRCode = mod.default || mod;
      QRCode.toDataURL?.(this.upiPayLink(), { width: 180, margin: 1 }).then(url => {
        this.upiQrUrl = url;
      }).catch(() => {
        this.upiQrUrl = '';
      });
    }).catch(() => {
      this.upiQrUrl = '';
    });
  }

  confirmPayment(): void {
    if (!this.checkoutOrder) return;
    const utr = this.utr.trim();
    if (utr.length < 6) {
      this.checkoutError = 'Enter the UPI reference number from GPay or PhonePe.';
      return;
    }

    this.isProcessingPayment.set(true);
    this.checkoutError = '';
    const account = this.upiAccounts[this.selectedUpiIndex];
    const req: VerifyPaymentRequest = {
      planCode: this.checkoutOrder.planCode,
      orderId: this.checkoutOrder.orderId,
      paymentId: utr,
      paymentMethod: 'UPI',
      upiId: account.upiId
    };

    this.subscriptionService.verifyPayment(req).subscribe({
      next: (res) => {
        this.isProcessingPayment.set(false);
        this.subscription.set(res.data);
        const code = this.checkoutOrder?.referenceCode;
        this.closeCheckoutModal();
        this.alertType = 'success';
        this.alertMsg = `Payment ${code} is waiting for confirmation. Your plan was not changed.`;
      },
      error: () => {
        this.isProcessingPayment.set(false);
        this.checkoutError = 'Payment could not be submitted. Open Pay again and enter the UPI reference.';
      }
    });
  }

  pendingReview() {
    return (this.subscription()?.transactions || []).find(tx => (tx.status || '').toUpperCase() === 'PENDING_REVIEW') || null;
  }

  visibleTransactions() {
    return (this.subscription()?.transactions || []).filter(tx => (tx.status || '').toUpperCase() !== 'AWAITING_PAYMENT');
  }

  paymentStatusLabel(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PENDING_REVIEW': return 'Waiting for confirmation';
      case 'SUCCESS': return 'Received';
      case 'REJECTED': return 'Not received';
      default: return status || '—';
    }
  }

  paymentStatusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PENDING_REVIEW': return 'status-pill-amber';
      case 'REJECTED': return 'status-pill-red';
      default: return 'status-pill-green';
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
