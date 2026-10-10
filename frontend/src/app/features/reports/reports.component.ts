import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService, ReportsSummary } from '../../core/services/reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>Analytics & Performance Reports</h2>
          <p class="subtitle">Real-time metrics on AI automation rates, conversation resolution, and customer satisfaction</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="exportCsv()" [disabled]="isExporting()">
            <span *ngIf="!isExporting()">📥 Export Report (CSV)</span>
            <span *ngIf="isExporting()" class="spinner-sm"></span>
          </button>
        </div>
      </div>

      <!-- PERIOD SELECTOR -->
      <div class="period-filter-bar">
        <div class="period-tabs">
          <button [class.active]="selectedPeriod() === 'TODAY'" (click)="setPeriod('TODAY')">Today</button>
          <button [class.active]="selectedPeriod() === '7_DAYS'" (click)="setPeriod('7_DAYS')">Last 7 Days</button>
          <button [class.active]="selectedPeriod() === '30_DAYS'" (click)="setPeriod('30_DAYS')">Last 30 Days</button>
          <button [class.active]="selectedPeriod() === 'ALL'" (click)="setPeriod('ALL')">All Time</button>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="metrics-grid" *ngIf="summary()">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Resolution Rate</span>
            <span class="metric-icon">🎯</span>
          </div>
          <div class="metric-value">{{ summary()!.resolutionRatePercentage }}%</div>
          <div class="metric-sub">{{ summary()!.resolvedConversations }} of {{ summary()!.totalConversations }} enquiries resolved</div>
        </div>

        <div class="metric-card highlight">
          <div class="metric-header">
            <span class="metric-title">AI Automation Rate</span>
            <span class="metric-icon">✨</span>
          </div>
          <div class="metric-value">{{ summary()!.aiAutomationRatePercentage }}%</div>
          <div class="metric-sub">{{ summary()!.aiHandledConversations }} conversations handled autonomously</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Avg Response Time</span>
            <span class="metric-icon">⚡</span>
          </div>
          <div class="metric-value">{{ summary()!.avgResponseTimeSeconds }}s</div>
          <div class="metric-sub">Sub-5-second automated reply rate</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Scheduled Bookings</span>
            <span class="metric-icon">📅</span>
          </div>
          <div class="metric-value">{{ summary()!.totalAppointments }}</div>
          <div class="metric-sub">{{ summary()!.confirmedAppointments }} confirmed slots</div>
        </div>
      </div>

      <!-- DETAILED BREAKDOWN PANELS -->
      <div class="details-grid" *ngIf="summary()">
        <!-- CONVERSATIONS BREAKDOWN -->
        <div class="card detail-card">
          <div class="card-header">
            <h3>💬 Conversation Volume Status</h3>
            <p>Breakdown across current pipeline</p>
          </div>
          <div class="breakdown-list">
            <div class="breakdown-row">
              <span class="label">● Resolved Conversations</span>
              <strong>{{ summary()!.resolvedConversations }}</strong>
            </div>
            <div class="breakdown-row">
              <span class="label">● Open Inquiries</span>
              <strong>{{ summary()!.openConversations }}</strong>
            </div>
            <div class="breakdown-row">
              <span class="label">● Pending Human Handoff</span>
              <strong>{{ summary()!.pendingConversations }}</strong>
            </div>
            <div class="breakdown-row total">
              <span class="label">Total Conversations</span>
              <strong>{{ summary()!.totalConversations }}</strong>
            </div>
          </div>
        </div>

        <!-- AI VS HUMAN HANDLING -->
        <div class="card detail-card">
          <div class="card-header">
            <h3>🤖 Handling Distribution</h3>
            <p>AI Assistant vs Human Staff</p>
          </div>
          <div class="handling-bars">
            <div class="handling-row">
              <div class="handling-label">
                <span>AI Automated</span>
                <strong>{{ summary()!.aiHandledConversations }} ({{ summary()!.aiAutomationRatePercentage }}%)</strong>
              </div>
              <div class="bar-track">
                <div class="bar-fill ai" [style.width.%]="summary()!.aiAutomationRatePercentage"></div>
              </div>
            </div>

            <div class="handling-row">
              <div class="handling-label">
                <span>Human Staff Handled</span>
                <strong>{{ summary()!.humanHandledConversations }} ({{ 100 - summary()!.aiAutomationRatePercentage | number:'1.0-1' }}%)</strong>
              </div>
              <div class="bar-track">
                <div class="bar-fill human" [style.width.%]="100 - summary()!.aiAutomationRatePercentage"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h2 { margin: 0 0 4px 0; font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .subtitle { color: #64748b; font-size: 0.9rem; margin: 0; }

    .period-filter-bar {
      margin-bottom: 24px;
    }

    .period-tabs {
      display: inline-flex;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 8px;
      gap: 4px;
    }

    .period-tabs button {
      padding: 6px 14px;
      border: none;
      background: none;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .period-tabs button.active {
      background: #ffffff;
      color: var(--color-primary, #2563eb);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }

    .metric-card {
      background: #ffffff;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .metric-card.highlight {
      border: 2px solid #7c3aed;
      background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .metric-title { font-size: 0.85rem; font-weight: 600; color: #64748b; }
    .metric-icon { font-size: 1.2rem; }

    .metric-value {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .metric-sub { font-size: 0.78rem; color: #94a3b8; }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 24px;
    }

    .card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid var(--color-border, #e2e8f0);
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .card-header h3 { margin: 0 0 4px 0; font-size: 1.15rem; color: #0f172a; }
    .card-header p { margin: 0 0 16px 0; font-size: 0.85rem; color: #64748b; }

    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .breakdown-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: #334155;
    }

    .breakdown-row.total {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      margin-top: 4px;
      font-weight: 700;
    }

    .handling-bars {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 10px;
    }

    .handling-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 6px;
      color: #334155;
    }

    .bar-track {
      height: 10px;
      background: #e2e8f0;
      border-radius: 5px;
      overflow: hidden;
    }

    .bar-fill.ai { height: 100%; background: #7c3aed; border-radius: 5px; }
    .bar-fill.human { height: 100%; background: #2563eb; border-radius: 5px; }

    .spinner-sm {
      display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ReportsComponent implements OnInit {
  summary = signal<ReportsSummary | null>(null);
  selectedPeriod = signal<string>('30_DAYS');
  isExporting = signal(false);

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.reportsService.getSummary(this.selectedPeriod()).subscribe({
      next: (res) => this.summary.set(res.data)
    });
  }

  setPeriod(p: string): void {
    this.selectedPeriod.set(p);
    this.loadSummary();
  }

  exportCsv(): void {
    this.isExporting.set(true);
    this.reportsService.downloadCsv().subscribe({
      next: (blob) => {
        this.isExporting.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartreply_conversations_${this.selectedPeriod()}_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.isExporting.set(false)
    });
  }
}
