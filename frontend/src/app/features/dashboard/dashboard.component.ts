import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats } from '../../core/models/auth.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page">
      <!-- Page Header -->
      <div class="dashboard-header">
        <div>
          <h1 class="page-title">Executive Dashboard</h1>
          <p class="page-subtitle">Real-time overview of AI customer support and automated messaging</p>
        </div>

        <div class="header-actions">
          <div class="filter-pill-group">
            <button
              class="pill-btn"
              [class.active]="selectedRange === 'today'"
              (click)="setFilter('today')"
            >
              Today
            </button>
            <button
              class="pill-btn"
              [class.active]="selectedRange === 'last_7_days'"
              (click)="setFilter('last_7_days')"
            >
              Last 7 Days
            </button>
            <button
              class="pill-btn"
              [class.active]="selectedRange === 'last_30_days'"
              (click)="setFilter('last_30_days')"
            >
              Last 30 Days
            </button>
          </div>

          <button class="btn btn-primary" routerLink="/inbox">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Open Unified Inbox
          </button>
        </div>
      </div>

      <!-- Setup Checklist Callout (if onboarding not complete) -->
      <div class="card setup-card" *ngIf="!authService.onboardingCompleted()">
        <div class="setup-header">
          <div class="setup-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <div>
            <h3>Complete your SmartReply AI Setup</h3>
            <p>Connect your business knowledge base and test your WhatsApp assistant in 3 simple steps.</p>
          </div>
          <a routerLink="/onboarding" class="btn btn-secondary setup-action-btn">
            Resume Onboarding Checklist &rarr;
          </a>
        </div>
      </div>

      <!-- KPI Metrics Grid -->
      <div class="kpi-grid">
        <!-- 1. Total Conversations -->
        <div class="card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Total Conversations</span>
            <div class="kpi-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-value">{{ stats?.totalConversations || 0 }}</div>
          <div class="kpi-footer">
            <span class="badge badge-blue">All Channels</span>
            <span class="kpi-subtext">WhatsApp Business API</span>
          </div>
        </div>

        <!-- 2. Open Enquiries -->
        <div class="card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Open Conversations</span>
            <div class="kpi-icon amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <div class="kpi-value">{{ stats?.openConversations || 0 }}</div>
          <div class="kpi-footer">
            <span class="badge badge-amber">{{ stats?.unansweredEnquiries || 0 }} Unanswered</span>
            <span class="kpi-subtext">Needs attention</span>
          </div>
        </div>

        <!-- 3. AI Automation Rate -->
        <div class="card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">AI Automation Handled</span>
            <div class="kpi-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="kpi-value">{{ stats?.aiHandledConversations || 0 }}</div>
          <div class="kpi-footer">
            <span class="badge badge-green">{{ stats?.averageResponseTime || '1.4s (AI)' }}</span>
            <span class="kpi-subtext">Zero-wait responses</span>
          </div>
        </div>

        <!-- 4. Upcoming Appointments -->
        <div class="card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Upcoming Bookings</span>
            <div class="kpi-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                <line x1="16" x2="16" y1="2" y2="6"></line>
                <line x1="8" x2="8" y1="2" y2="6"></line>
                <line x1="3" x2="19" y1="10" y2="10"></line>
              </svg>
            </div>
          </div>
          <div class="kpi-value">{{ stats?.upcomingAppointmentsCount || 0 }}</div>
          <div class="kpi-footer">
            <a routerLink="/appointments" class="view-link">View schedule &rarr;</a>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-row">
        <div class="card chart-card">
          <div class="chart-header">
            <div>
              <h3>Message Volume Breakdown</h3>
              <p>AI automated responses vs human interventions over time</p>
            </div>
          </div>
          <div class="chart-container">
            <canvas #volumeChartCanvas></canvas>
          </div>
        </div>

        <div class="card chart-card">
          <div class="chart-header">
            <div>
              <h3>Resolution & Handoff Trend</h3>
              <p>Conversations resolved autonomously vs escalated to staff</p>
            </div>
          </div>
          <div class="chart-container">
            <canvas #resolutionChartCanvas></canvas>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Recent Activity & Quick Shortcuts -->
      <div class="bottom-row">
        <!-- Recent Enquiries -->
        <div class="card flex-2">
          <div class="section-card-header">
            <div>
              <h3>Recent Customer Enquiries</h3>
              <p>Latest WhatsApp interactions processed by SmartReply AI</p>
            </div>
            <a routerLink="/inbox" class="btn btn-secondary btn-sm">View All in Inbox</a>
          </div>

          <div class="activity-list" *ngIf="stats?.recentActivity?.length; else emptyActivity">
            <div class="activity-item" *ngFor="let item of stats?.recentActivity">
              <div class="activity-avatar" [class.ai]="item.senderType === 'AI'">
                {{ item.senderType === 'AI' ? 'AI' : item.customerName.charAt(0) }}
              </div>
              <div class="activity-content">
                <div class="activity-title">
                  <span class="customer-name">{{ item.customerName }}</span>
                  <span class="activity-type-badge" [class.ai]="item.senderType === 'AI'">
                    {{ item.senderType }}
                  </span>
                </div>
                <p class="activity-text">{{ item.textContent }}</p>
              </div>
              <div class="activity-time">
                {{ item.createdAt | date:'shortTime' }}
              </div>
            </div>
          </div>

          <ng-template #emptyActivity>
            <div class="empty-state">
              <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h4>No conversations recorded yet</h4>
              <p>Incoming customer messages from your connected WhatsApp number or the development sandbox simulator will appear right here in real time.</p>
              <div class="empty-actions">
                <a routerLink="/whatsapp" class="btn btn-primary btn-sm">Configure WhatsApp Channel</a>
                <a routerLink="/knowledge-base" class="btn btn-secondary btn-sm">Add Business FAQs</a>
              </div>
            </div>
          </ng-template>
        </div>

        <!-- Automation & Channel Health -->
        <div class="card flex-1">
          <div class="section-card-header">
            <div>
              <h3>System & Channel Health</h3>
              <p>Real-time status of integrations</p>
            </div>
          </div>

          <div class="health-checklist">
            <div class="health-item">
              <div class="health-status-icon success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div class="health-info">
                <div class="health-title">AI Knowledge Base Engine</div>
                <div class="health-desc">Active & Ready for grounding</div>
              </div>
              <span class="badge badge-green">Healthy</span>
            </div>

            <div class="health-item">
              <div class="health-status-icon success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div class="health-info">
                <div class="health-title">WhatsApp Webhook Listener</div>
                <div class="health-desc">Idempotency & verification active</div>
              </div>
              <span class="badge badge-green">Live</span>
            </div>

            <div class="health-item">
              <div class="health-status-icon warning">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div class="health-info">
                <div class="health-title">Messaging Adapter Mode</div>
                <div class="health-desc">Sandbox Adapter active</div>
              </div>
              <span class="badge badge-amber">Sandbox</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .dashboard-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--slate-900);
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--slate-500);
      margin-top: 0.125rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      flex-wrap: wrap;
    }

    .filter-pill-group {
      background: var(--slate-200);
      padding: 0.25rem;
      border-radius: var(--radius-md);
      display: flex;
      gap: 0.25rem;
    }

    .pill-btn {
      border: none;
      background: transparent;
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-600);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .pill-btn.active {
      background: #ffffff;
      color: var(--slate-900);
      box-shadow: var(--shadow-xs);
    }

    .setup-card {
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
      border: 1px solid #bfdbfe;
    }

    .setup-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
    }

    .setup-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--primary-600);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .setup-icon svg {
      width: 24px;
      height: 24px;
    }

    .setup-action-btn {
      margin-left: auto;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    .kpi-card {
      display: flex;
      flex-direction: column;
    }

    .kpi-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .kpi-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--slate-500);
    }

    .kpi-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kpi-icon svg {
      width: 18px;
      height: 18px;
    }

    .kpi-icon.blue { background: var(--primary-50); color: var(--primary-600); }
    .kpi-icon.amber { background: var(--warning-bg); color: var(--warning-text); }
    .kpi-icon.green { background: var(--success-bg); color: var(--wa-green-600); }
    .kpi-icon.purple { background: #faf5ff; color: #9333ea; }

    .kpi-value {
      font-size: 2rem;
      font-weight: 800;
      color: var(--slate-900);
      line-height: 1.2;
      margin-bottom: 0.75rem;
    }

    .kpi-footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: auto;
    }

    .kpi-subtext {
      font-size: 0.75rem;
      color: var(--slate-500);
    }

    .view-link {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary-600);
      text-decoration: none;
    }

    .view-link:hover {
      text-decoration: underline;
    }

    .charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 1.25rem;
    }

    .chart-card {
      display: flex;
      flex-direction: column;
    }

    .chart-header {
      margin-bottom: 1.25rem;
    }

    .chart-header h3 {
      font-size: 1rem;
      font-weight: 700;
    }

    .chart-header p {
      font-size: 0.75rem;
      color: var(--slate-500);
    }

    .chart-container {
      position: relative;
      height: 260px;
      width: 100%;
    }

    .bottom-row {
      display: flex;
      gap: 1.25rem;
      flex-wrap: wrap;
    }

    .flex-2 { flex: 2; min-width: 320px; }
    .flex-1 { flex: 1; min-width: 300px; }

    .section-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .section-card-header h3 {
      font-size: 1rem;
      font-weight: 700;
    }

    .section-card-header p {
      font-size: 0.75rem;
      color: var(--slate-500);
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding-bottom: 0.875rem;
      border-bottom: 1px solid var(--slate-100);
    }

    .activity-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .activity-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--slate-200);
      color: var(--slate-700);
      font-weight: 700;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-avatar.ai {
      background: linear-gradient(135deg, var(--primary-600), var(--wa-green-600));
      color: #ffffff;
    }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .customer-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--slate-900);
    }

    .activity-type-badge {
      font-size: 0.625rem;
      font-weight: 700;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      background: var(--slate-100);
      color: var(--slate-600);
    }

    .activity-type-badge.ai {
      background: var(--success-bg);
      color: var(--wa-green-700);
    }

    .activity-text {
      font-size: 0.8125rem;
      color: var(--slate-600);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .activity-time {
      font-size: 0.75rem;
      color: var(--slate-400);
      white-space: nowrap;
    }

    .empty-state {
      text-align: center;
      padding: 2.5rem 1.5rem;
    }

    .empty-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: var(--slate-100);
      color: var(--slate-400);
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-icon svg {
      width: 26px;
      height: 26px;
    }

    .empty-state h4 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.375rem;
    }

    .empty-state p {
      font-size: 0.8125rem;
      max-width: 420px;
      margin: 0 auto 1.25rem;
      color: var(--slate-500);
    }

    .empty-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .health-checklist {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .health-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--slate-50);
      border-radius: var(--radius-md);
      border: 1px solid var(--slate-200);
    }

    .health-status-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .health-status-icon.success {
      background: var(--success-bg);
      color: var(--wa-green-600);
    }

    .health-status-icon.warning {
      background: var(--warning-bg);
      color: var(--warning-text);
    }

    .health-status-icon svg {
      width: 14px;
      height: 14px;
    }

    .health-info {
      flex: 1;
    }

    .health-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-900);
    }

    .health-desc {
      font-size: 0.6875rem;
      color: var(--slate-500);
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  authService = inject(AuthService);

  @ViewChild('volumeChartCanvas') volumeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('resolutionChartCanvas') resolutionCanvas!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  selectedRange = 'last_7_days';
  isLoading = false;

  private volumeChart: Chart | null = null;
  private resolutionChart: Chart | null = null;

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    if (this.stats) {
      this.renderCharts();
    }
  }

  ngOnDestroy(): void {
    if (this.volumeChart) this.volumeChart.destroy();
    if (this.resolutionChart) this.resolutionChart.destroy();
  }

  setFilter(range: string): void {
    this.selectedRange = range;
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.dashboardService.getStats(this.selectedRange).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.stats = res.data;
          setTimeout(() => this.renderCharts(), 50);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private renderCharts(): void {
    if (!this.volumeCanvas || !this.resolutionCanvas || !this.stats) return;

    if (this.volumeChart) this.volumeChart.destroy();
    if (this.resolutionChart) this.resolutionChart.destroy();

    const labels = this.stats.volumeTrend.map(v => v.date);
    const volumeData = this.stats.volumeTrend.map(v => v.total);
    const aiData = this.stats.volumeTrend.map(v => v.aiHandled);

    // 1. Volume Chart
    const vCtx = this.volumeCanvas.nativeElement.getContext('2d');
    if (vCtx) {
      this.volumeChart = new Chart(vCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'AI Automated',
              data: aiData,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              fill: true,
              tension: 0.35,
              borderWidth: 2,
              pointRadius: 3
            },
            {
              label: 'Total Conversations',
              data: volumeData,
              borderColor: '#94a3b8',
              borderDash: [5, 5],
              fill: false,
              tension: 0.35,
              borderWidth: 2,
              pointRadius: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // 2. Resolution Chart
    const rCtx = this.resolutionCanvas.nativeElement.getContext('2d');
    if (rCtx) {
      const resData = this.stats.resolutionTrend.map(r => r.resolved);
      this.resolutionChart = new Chart(rCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Resolved Inquiries',
              data: resData,
              backgroundColor: '#10b981',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }
}
