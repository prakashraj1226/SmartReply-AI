import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionService, SubscriptionDetails, SubscriptionPlan, CheckoutOrder, VerifyPaymentRequest } from '../../core/services/subscription.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="subscriptions-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>Subscription & Billing</h2>
          <p class="subtitle">Manage your SaaS plan, conversation allowances, invoices, and payment gateways</p>
        </div>
      </div>

      <!-- ALERTS -->
      <div *ngIf="alertMsg" class="alert" [ngClass]="alertType">
        <span>{{ alertMsg }}</span>
        <button class="alert-close" (click)="alertMsg = ''">✕</button>
      </div>

      <!-- CURRENT PLAN USAGE CARD -->
      <div class="card current-plan-card" *ngIf="subscription()">
        <div class="plan-hero-row">
          <div>
            <div class="plan-tag-row">
              <span class="plan-tag">{{ subscription()!.planName }}</span>
              <span class="status-pill" [attr.data-status]="subscription()!.status">{{ subscription()!.status }}</span>
              <span *ngIf="subscription()!.cancelAtPeriodEnd" class="cancelling-pill">Cancels at period end</span>
            </div>
            <h3 class="plan-price">₹{{ subscription()!.priceInr }} <span>/ month</span></h3>
            <p class="period-text">Current cycle ends on {{ formatDate(subscription()!.currentPeriodEnd) }}</p>
          </div>

          <div class="usage-stat-box">
            <div class="usage-header">
              <span>Monthly WhatsApp Conversations</span>
              <strong>{{ subscription()!.currentMonthConversations }} / {{ subscription()!.maxConversationsMonthly }}</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="getUsagePercentage()"></div>
            </div>
            <span class="remaining-text">{{ subscription()!.remainingConversations }} conversations remaining this cycle</span>
          </div>
        </div>
      </div>

      <!-- PLANS COMPARISON -->
      <div class="plans-section">
        <h3>Available Subscription Plans</h3>
        <p class="section-desc">Select the tier that fits your customer enquiry volume</p>

        <div class="plans-grid">
          <div *ngFor="let p of plans()" class="card plan-card" [class.highlighted]="p.code === 'GROWTH'" [class.current-active]="p.code === subscription()?.planCode">
            <div class="plan-card-header">
              <span *ngIf="p.code === 'GROWTH'" class="popular-badge">Most Popular</span>
              <h4>{{ p.name }}</h4>
              <div class="price-box">
                <span class="currency">₹</span>
                <span class="amount">{{ p.priceInr }}</span>
                <span class="period">/mo</span>
              </div>
            </div>

            <ul class="features-list">
              <li>✓ {{ p.maxConversationsMonthly | number }} Conversations/month</li>
              <li>✓ Up to {{ p.maxAgents }} Staff Agents</li>
              <li>✓ {{ p.aiFeaturesEnabled ? 'AI FAQ Autonomous Grounding' : 'Basic Rule Assistant' }}</li>
              <li>✓ Official WhatsApp Cloud API</li>
              <li>✓ Appointment Booking & Calendar</li>
              <li *ngIf="p.code === 'GROWTH' || p.code === 'PRO'">✓ AI Reply Suggestions in Inbox</li>
              <li *ngIf="p.code === 'GROWTH' || p.code === 'PRO'">✓ Workflow Automations Engine</li>
              <li *ngIf="p.code === 'PRO'">✓ 24/7 Priority Support & SLA</li>
            </ul>

            <div class="plan-card-footer">
              <button
                *ngIf="p.code !== subscription()?.planCode"
                class="btn btn-block"
                [class.btn-primary]="p.code === 'GROWTH'"
                [class.btn-outline]="p.code !== 'GROWTH'"
                (click)="startCheckout(p.code)"
              >
                Upgrade to {{ p.name }}
              </button>
              <button *ngIf="p.code === subscription()?.planCode" class="btn btn-block btn-secondary" disabled>
                ✓ Current Active Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- BILLING & INVOICE HISTORY -->
      <div class="card invoices-card" *ngIf="subscription()?.transactions">
        <div class="card-header">
          <h3>🧾 Payment & Invoice History</h3>
          <p>Verified transaction records and billing receipts</p>
        </div>

        <div *ngIf="subscription()!.transactions.length === 0" class="empty-state">
          <p>No billing transactions yet. Once you upgrade your plan, receipts will appear here.</p>
        </div>

        <div *ngIf="subscription()!.transactions.length > 0" class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Plan</th>
                <th>Gateway</th>
                <th>Payment ID</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of subscription()!.transactions">
                <td>{{ formatDate(tx.createdAt) }}</td>
                <td><strong>{{ tx.planName }}</strong></td>
                <td>
                  <span class="gateway-pill" [class.simulated]="tx.gateway === 'SIMULATED'">{{ tx.gateway }}</span>
                </td>
                <td><code>{{ tx.paymentId || '—' }}</code></td>
                <td><strong>₹{{ tx.amountInr }}</strong></td>
                <td><span class="status-pill" [attr.data-status]="tx.status">{{ tx.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- CHECKOUT MODAL -->
    <div *ngIf="showCheckoutModal && checkoutOrder" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>💳 Checkout: {{ checkoutOrder.planCode }} Plan</h3>
          <button class="close-btn" (click)="closeCheckoutModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="order-summary-box">
            <div class="summary-line">
              <span>Subscription Tier:</span>
              <strong>{{ checkoutOrder.planCode }}</strong>
            </div>
            <div class="summary-line">
              <span>Billing Interval:</span>
              <span>1 Month</span>
            </div>
            <div class="summary-line total">
              <span>Total Amount:</span>
              <strong>₹{{ checkoutOrder.amountInr }}</strong>
            </div>
          </div>

          <div class="gateway-mode-notice">
            <span class="notice-icon">🛡️</span>
            <div>
              <strong>Secure Payment Verification</strong>
              <p *ngIf="checkoutOrder.simulated">
                Running in Development Simulator mode. A verified simulation payment transaction will be signed and processed.
              </p>
              <p *ngIf="!checkoutOrder.simulated">
                Official Razorpay Gateway integrated. Complete payment to activate your tier.
              </p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeCheckoutModal()">Cancel</button>
          <button class="btn btn-primary" [disabled]="isProcessingPayment()" (click)="confirmPayment()">
            <span *ngIf="!isProcessingPayment()">Pay & Activate (₹{{ checkoutOrder.amountInr }})</span>
            <span *ngIf="isProcessingPayment()" class="spinner-sm"></span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .subscriptions-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h2 {
      margin: 0 0 4px 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }

    .subtitle {
      color: #64748b;
      font-size: 0.9rem;
      margin: 0;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .alert.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .alert.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .alert-close { background: none; border: none; cursor: pointer; }

    .card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid var(--color-border, #e2e8f0);
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      margin-bottom: 28px;
    }

    /* CURRENT PLAN */
    .current-plan-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #cbd5e1;
    }

    .plan-hero-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 32px;
      flex-wrap: wrap;
    }

    .plan-tag-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }

    .plan-tag {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .status-pill {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .status-pill[data-status="ACTIVE"] { background: #dcfce7; color: #166534; }
    .status-pill[data-status="PAST_DUE"] { background: #fee2e2; color: #991b1b; }
    .status-pill[data-status="SUCCESS"] { background: #dcfce7; color: #166534; }

    .cancelling-pill {
      font-size: 0.72rem;
      background: #fef2f2;
      color: #dc2626;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .plan-price {
      font-size: 2rem;
      font-weight: 800;
      margin: 0 0 6px 0;
      color: var(--color-primary, #2563eb);
    }

    .plan-price span {
      font-size: 0.9rem;
      font-weight: 400;
      color: #64748b;
    }

    .period-text {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
    }

    .usage-stat-box {
      flex: 1;
      max-width: 400px;
      min-width: 280px;
      background: #ffffff;
      padding: 18px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .usage-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 8px;
      color: #334155;
    }

    .progress-track {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .progress-fill {
      height: 100%;
      background: var(--color-primary, #2563eb);
      border-radius: 4px;
      transition: width 0.3s;
    }

    .remaining-text {
      font-size: 0.78rem;
      color: #64748b;
    }

    /* PLANS GRID */
    .plans-section h3 {
      margin: 0 0 4px 0;
      font-size: 1.25rem;
      color: #0f172a;
    }

    .section-desc {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0 0 20px 0;
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .plan-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .plan-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px -2px rgba(0,0,0,0.06);
    }

    .plan-card.highlighted {
      border: 2px solid var(--color-primary, #2563eb);
      box-shadow: 0 4px 12px rgba(37,99,235,0.1);
    }

    .popular-badge {
      position: absolute;
      top: -12px;
      right: 20px;
      background: var(--color-primary, #2563eb);
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 12px;
    }

    .plan-card-header h4 {
      margin: 0 0 10px 0;
      font-size: 1.1rem;
      color: #0f172a;
    }

    .price-box {
      margin-bottom: 16px;
    }

    .price-box .currency {
      font-size: 1.1rem;
      font-weight: 600;
      color: #334155;
    }

    .price-box .amount {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
    }

    .price-box .period {
      font-size: 0.85rem;
      color: #64748b;
    }

    .features-list {
      list-style: none;
      padding: 0;
      margin: 0 0 20px 0;
      flex: 1;
    }

    .features-list li {
      font-size: 0.82rem;
      color: #475569;
      padding: 6px 0;
      border-bottom: 1px solid #f8fafc;
    }

    .btn-block { width: 100%; }

    /* INVOICES */
    .invoices-card .card-header {
      margin-bottom: 16px;
    }

    .invoices-card .card-header h3 {
      margin: 0 0 4px 0;
      font-size: 1.15rem;
      color: #0f172a;
    }

    .invoices-card .card-header p {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      text-align: left;
    }

    .data-table th { padding: 12px 16px; background: #f8fafc; color: #475569; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }

    .gateway-pill {
      font-size: 0.72rem;
      font-weight: 700;
      background: #eff6ff;
      color: #1d4ed8;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .gateway-pill.simulated {
      background: #f1f5f9;
      color: #475569;
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-dialog { background: #ffffff; border-radius: 12px; width: 90%; max-width: 480px; overflow: hidden; }
    .modal-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 1.15rem; }
    .close-btn { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #94a3b8; }
    .modal-body { padding: 20px; }

    .order-summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.88rem;
      margin-bottom: 8px;
      color: #334155;
    }

    .summary-line.total {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 10px;
      font-size: 1.05rem;
    }

    .gateway-mode-notice {
      display: flex;
      gap: 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px;
      font-size: 0.82rem;
      color: #166534;
    }

    .notice-icon { font-size: 1.3rem; }

    .modal-footer { padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; }

    .spinner-sm {
      display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
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

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.loadSubscription();
    this.loadPlans();
  }

  loadSubscription(): void {
    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (res) => this.subscription.set(res.data)
    });
  }

  loadPlans(): void {
    this.subscriptionService.getPlans().subscribe({
      next: (res) => this.plans.set(res.data || [])
    });
  }

  getUsagePercentage(): number {
    const sub = this.subscription();
    if (!sub || sub.maxConversationsMonthly === 0) return 0;
    return Math.min(100, Math.round((sub.currentMonthConversations / sub.maxConversationsMonthly) * 100));
  }

  startCheckout(planCode: string): void {
    this.subscriptionService.createCheckoutOrder(planCode).subscribe({
      next: (res) => {
        this.checkoutOrder = res.data;
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
      error: (err) => {
        this.isProcessingPayment.set(false);
        this.alertType = 'error';
        this.alertMsg = err?.error?.message || 'Payment verification failed.';
      }
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
