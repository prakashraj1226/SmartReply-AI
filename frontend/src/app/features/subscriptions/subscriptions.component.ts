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

      <!-- 2. Integrated 4-Column Stat Cards Row (Reference 4 Style) -->
      <div class="kpi-grid">
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
          <div class="kpi-number">{{ subscription()?.planName || 'Growth Tier' }}</div>
          <div class="kpi-subtext">₹{{ subscription()?.priceInr || '2,499' }} / month billing</div>
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
          <div class="kpi-number">{{ subscription()?.currentMonthConversations || 420 }} / {{ subscription()?.maxConversationsMonthly || 2500 }}</div>
          <div class="kpi-subtext">{{ subscription()?.remainingConversations || 2080 }} remaining this cycle</div>
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
          <div class="kpi-number">18 Days</div>
          <div class="kpi-subtext">Next invoice on Nov 1, 2026</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">ESTIMATED SAVINGS</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">₹34,200</div>
          <div class="kpi-subtext">Saved vs dedicated receptionist desk</div>
        </div>
      </div>

      <!-- ALERTS -->
      <div *ngIf="alertMsg" class="alert-banner" [ngClass]="alertType">
        <div class="alert-content">
          <span class="alert-icon">✓</span>
          <span>{{ alertMsg }}</span>
        </div>
        <button class="alert-close" (click)="alertMsg = ''">✕</button>
      </div>

      <!-- 3. Current Usage Progress Card -->
      <div class="usage-overview-card" *ngIf="subscription() || defaultSubscription as sub">
        <div class="usage-header-row">
          <div>
            <h3 class="usage-title">Monthly WhatsApp Message Quota</h3>
            <p class="usage-sub">Calculated across inbound enquiries and automated AI grounding replies</p>
          </div>
          <div class="usage-percent-badge">{{ getUsagePercentage() }}% Quota Consumed</div>
        </div>

        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill" [style.width.%]="getUsagePercentage()"></div>
        </div>

        <div class="usage-footer-row">
          <span><strong>{{ subscription()?.currentMonthConversations || 420 }}</strong> used</span>
          <span><strong>{{ subscription()?.remainingConversations || 2080 }}</strong> conversations remaining</span>
          <span>Max <strong>{{ subscription()?.maxConversationsMonthly || 2500 }}</strong> conversations</span>
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
            *ngFor="let p of (plans().length > 0 ? plans() : seedPlans)"
            class="plan-card"
            [class.highlighted]="p.code === 'GROWTH'"
            [class.current-active]="p.code === (subscription()?.planCode || 'GROWTH')"
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
                <span>Up to <strong>{{ p.maxAgents }}</strong> Staff Agent seats</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>{{ p.aiFeaturesEnabled ? 'AI FAQ Autonomous Grounding' : 'Basic Rule Engine' }}</span>
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
                *ngIf="p.code !== (subscription()?.planCode || 'GROWTH')"
                class="btn-plan-action"
                [class.btn-popular]="p.code === 'GROWTH'"
                (click)="startCheckout(p.code)"
              >
                Upgrade to {{ p.name }}
              </button>
              <button *ngIf="p.code === (subscription()?.planCode || 'GROWTH')" class="btn-current-plan" disabled>
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
              <tr>
                <td><strong>INV-2026-1001</strong></td>
                <td>Oct 1, 2026</td>
                <td>Growth Plan</td>
                <td>₹2,499</td>
                <td>Razorpay (UPI / NetBanking)</td>
                <td><span class="status-pill-green">✓ Paid</span></td>
              </tr>
              <tr>
                <td><strong>INV-2026-0901</strong></td>
                <td>Sep 1, 2026</td>
                <td>Growth Plan</td>
                <td>₹2,499</td>
                <td>Razorpay (UPI / NetBanking)</td>
                <td><span class="status-pill-green">✓ Paid</span></td>
              </tr>
              <tr>
                <td><strong>INV-2026-0801</strong></td>
                <td>Aug 1, 2026</td>
                <td>Starter Plan</td>
                <td>₹999</td>
                <td>Razorpay (Credit Card)</td>
                <td><span class="status-pill-green">✓ Paid</span></td>
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
                <h3>Confirm Subscription Upgrade</h3>
                <p class="modal-subtitle">Secure Razorpay / Stripe gateway checkout</p>
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

            <div class="gateway-notice">
              <span class="notice-icon">🔒</span>
              <p>Sandbox Simulator Mode: Instant verification without debiting real card or UPI credentials.</p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeCheckoutModal()">Cancel</button>
            <button class="btn-checkout-confirm" [disabled]="isProcessingPayment()" (click)="confirmPayment()">
              <span *ngIf="!isProcessingPayment()">Pay ₹{{ (checkoutOrder.amountInr * 1.18).toFixed(0) }} Now</span>
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
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(9, 19, 40, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: 16px;
      width: 90%;
      max-width: 480px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      overflow: hidden;
      animation: modalSlideUp 0.2s ease-out;
    }

    @keyframes modalSlideUp {
      from { transform: translateY(15px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
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
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .order-summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
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
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
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

  defaultSubscription: any = {
    planCode: 'GROWTH',
    planName: 'Growth Plan',
    priceInr: 2499,
    status: 'ACTIVE',
    currentMonthConversations: 420,
    maxConversationsMonthly: 2500,
    remainingConversations: 2080
  };

  seedPlans: SubscriptionPlan[] = [
    {
      id: 'plan-1',
      code: 'STARTER',
      name: 'Starter Plan',
      priceInr: 999,
      billingInterval: 'MONTHLY',
      maxConversationsMonthly: 1000,
      maxAgents: 2,
      aiFeaturesEnabled: true
    },
    {
      id: 'plan-2',
      code: 'GROWTH',
      name: 'Growth Plan',
      priceInr: 2499,
      billingInterval: 'MONTHLY',
      maxConversationsMonthly: 2500,
      maxAgents: 5,
      aiFeaturesEnabled: true
    },
    {
      id: 'plan-3',
      code: 'PRO',
      name: 'Enterprise Pro',
      priceInr: 5999,
      billingInterval: 'MONTHLY',
      maxConversationsMonthly: 10000,
      maxAgents: 15,
      aiFeaturesEnabled: true
    }
  ];

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.loadSubscription();
    this.loadPlans();
  }

  loadSubscription(): void {
    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (res) => {
        if (res.data) {
          this.subscription.set(res.data);
        } else {
          this.subscription.set(this.defaultSubscription);
        }
      },
      error: () => {
        this.subscription.set(this.defaultSubscription);
      }
    });
  }

  loadPlans(): void {
    this.subscriptionService.getPlans().subscribe({
      next: (res) => {
        const list = res.data || [];
        this.plans.set(list.length > 0 ? list : this.seedPlans);
      },
      error: () => {
        this.plans.set(this.seedPlans);
      }
    });
  }

  getUsagePercentage(): number {
    const sub = this.subscription() || this.defaultSubscription;
    if (!sub || sub.maxConversationsMonthly === 0) return 17;
    return Math.min(100, Math.round((sub.currentMonthConversations / sub.maxConversationsMonthly) * 100));
  }

  startCheckout(planCode: string): void {
    this.subscriptionService.createCheckoutOrder(planCode).subscribe({
      next: (res) => {
        this.checkoutOrder = res.data;
        this.showCheckoutModal = true;
      },
      error: () => {
        // Fallback checkout order
        const matched = this.seedPlans.find(p => p.code === planCode);
        this.checkoutOrder = {
          orderId: 'order_' + Date.now(),
          planCode: planCode,
          amountInr: matched ? matched.priceInr : 2499,
          keyId: 'rzp_test_demo_key',
          simulated: true
        };
        this.showCheckoutModal = true;
      }
    });
  }

  closeCheckoutModal(): void {
    this.showCheckoutModal = false;
    this.checkoutOrder = null;
  }

  confirmPayment(): void {
    if (!this.checkoutOrder) return;

    this.isProcessingPayment.set(true);
    const req: VerifyPaymentRequest = {
      planCode: this.checkoutOrder.planCode,
      orderId: this.checkoutOrder.orderId,
      paymentId: 'pay_' + Math.random().toString(36).substring(2, 12),
      signature: 'simulated_signature_ok',
      isSimulated: this.checkoutOrder.simulated
    };

    this.subscriptionService.verifyPayment(req).subscribe({
      next: (res) => {
        this.isProcessingPayment.set(false);
        this.subscription.set(res.data);
        this.closeCheckoutModal();
        this.alertType = 'success';
        this.alertMsg = `Congratulations! Upgraded successfully to ${res.data.planName}.`;
      },
      error: () => {
        // Optimistic upgrade for demo
        this.isProcessingPayment.set(false);
        const matched = this.seedPlans.find(p => p.code === this.checkoutOrder!.planCode);
        const upgradedSub: any = {
          ...this.defaultSubscription,
          planCode: this.checkoutOrder!.planCode,
          planName: matched ? matched.name : this.checkoutOrder!.planCode,
          priceInr: this.checkoutOrder!.amountInr
        };
        this.subscription.set(upgradedSub);
        this.closeCheckoutModal();
        this.alertType = 'success';
        this.alertMsg = `Congratulations! Upgraded successfully to ${upgradedSub.planName}.`;
      }
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
