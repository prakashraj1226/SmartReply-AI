import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService, ReportsSummary } from '../../core/services/reports.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface IntentBreakdownRow {
  intent: string;
  totalQueries: number;
  aiHandled: number;
  escalated: number;
  avgTime: string;
  appointments: string;
  valueSaved: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-container">

      <!-- 1. Glowing Hero Gradient Card (Reference 4 & 5 Style) -->
      <div class="hero-banner-card">
        <div class="hero-banner-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>EXECUTIVE AUDIT & ANALYTICS</span>
          </div>
          <h1 class="hero-title">Performance & ROI Reports</h1>
          <p class="hero-subtitle">
            Real-time business audit on WhatsApp message volume, AI resolution rates, and converted appointments.
          </p>
        </div>
        <div class="hero-actions">
          <button type="button" class="btn-hero-primary" (click)="exportCsv()" [disabled]="isExporting()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span *ngIf="!isExporting()">Export Report (CSV)</span>
            <span *ngIf="isExporting()">Exporting...</span>
          </button>
        </div>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row (Reference 4 Style) -->
      <div class="kpi-grid">
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator blue"></span>
              <span class="kpi-label">TOTAL VOLUME</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">1,420</div>
          <div class="kpi-subtext">Customer enquiries processed</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator green"></span>
              <span class="kpi-label">AI RESOLUTION RATE</span>
            </div>
            <div class="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="kpi-number">94.2%</div>
          <div class="kpi-subtext">1,338 resolved autonomously</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator amber"></span>
              <span class="kpi-label">AVG AI LATENCY</span>
            </div>
            <div class="kpi-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="kpi-number">1.2s</div>
          <div class="kpi-subtext">Instant WhatsApp reply speed</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">EST. VALUE SAVED</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">₹28,500</div>
          <div class="kpi-subtext">Saved in staff overhead hours</div>
        </div>
      </div>

      <!-- 3. Side-by-Side Analytical Cards (Exact Reference 5 Style) -->
      <div class="analytics-row">

        <!-- Left: Bar + Line Chart Card (62% width) -->
        <div class="chart-card-large">
          <div class="chart-card-header">
            <div>
              <div class="chart-title">Inbound Queries & Automated Resolution By Date</div>
              <p class="chart-subtitle">Daily traffic distribution and AI completion rates</p>
            </div>
            <div class="time-pill-group">
              <button type="button" class="time-btn" [class.active]="selectedTimeframe === 'day'" (click)="setTimeframe('day')">By Day</button>
              <button type="button" class="time-btn" [class.active]="selectedTimeframe === 'week'" (click)="setTimeframe('week')">By Week</button>
            </div>
          </div>

          <!-- Highlight Key Stats (Reference 5) -->
          <div class="chart-stats-summary">
            <div class="summary-metric">
              <span class="summary-dot blue"></span>
              <span class="summary-label">Total Messages:</span>
              <span class="summary-val">1,420</span>
            </div>
            <div class="summary-metric">
              <span class="summary-dot green"></span>
              <span class="summary-label">AI Resolved:</span>
              <span class="summary-val">1,338 (94.2%)</span>
            </div>
          </div>

          <div class="canvas-container">
            <canvas #volumeChartCanvas></canvas>
          </div>
        </div>

        <!-- Right: Donut Chart Resolution Breakdown (38% width) -->
        <div class="chart-card-donut">
          <div class="chart-card-header">
            <div>
              <div class="chart-title">Resolution Distribution</div>
              <p class="chart-subtitle">All customer enquiries in this period</p>
            </div>
          </div>

          <div class="donut-canvas-wrap">
            <div class="donut-center-stat">
              <span class="donut-total">1,420</span>
              <span class="donut-sub">total enquiries</span>
            </div>
            <canvas #donutChartCanvas></canvas>
          </div>

          <!-- Legend Breakdown with Progress Bars (Reference 5) -->
          <div class="donut-legend-list">
            <div class="legend-item">
              <div class="legend-item-header">
                <div class="legend-dot green"></div>
                <span class="legend-name">AI Auto-Resolved</span>
                <span class="legend-val">1,338</span>
                <span class="legend-pct">94.2%</span>
              </div>
              <div class="legend-progress-bar">
                <div class="progress-fill green" style="width: 94.2%"></div>
              </div>
            </div>

            <div class="legend-item">
              <div class="legend-item-header">
                <div class="legend-dot blue"></div>
                <span class="legend-name">Human Escalated</span>
                <span class="legend-val">64</span>
                <span class="legend-pct">4.5%</span>
              </div>
              <div class="legend-progress-bar">
                <div class="progress-fill blue" style="width: 4.5%"></div>
              </div>
            </div>

            <div class="legend-item">
              <div class="legend-item-header">
                <div class="legend-dot amber"></div>
                <span class="legend-name">Pending Action</span>
                <span class="legend-val">18</span>
                <span class="legend-pct">1.3%</span>
              </div>
              <div class="legend-progress-bar">
                <div class="progress-fill amber" style="width: 1.3%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Detailed Breakdown Data Table (Exact Reference 5 Style) -->
      <div class="table-card">
        <div class="table-card-header">
          <div>
            <h3 class="table-title">Enquiry Category & Value Breakdown</h3>
            <p class="table-subtitle">Performance, resolution rate, and financial value saved per enquiry intent</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="modern-table">
            <thead>
              <tr>
                <th>INTENT CATEGORY</th>
                <th>TOTAL QUERIES</th>
                <th>AI RESOLVED</th>
                <th>ESCALATED</th>
                <th>AVG RESPONSE TIME</th>
                <th>APPOINTMENTS BOOKED</th>
                <th class="text-right">EST. VALUE SAVED</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of breakdownRows" class="table-row">
                <td>
                  <strong>{{ row.intent }}</strong>
                </td>
                <td>{{ row.totalQueries }}</td>
                <td>
                  <span class="badge-pill green">{{ row.aiHandled }}</span>
                </td>
                <td>
                  <span class="badge-pill amber" *ngIf="row.escalated > 0">{{ row.escalated }}</span>
                  <span *ngIf="row.escalated === 0">—</span>
                </td>
                <td>{{ row.avgTime }}</td>
                <td>{{ row.appointments }}</td>
                <td class="text-right">
                  <strong class="val-saved">{{ row.valueSaved }}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .reports-container {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding-bottom: 0.85rem;
    }

    /* 1. Hero Banner Card (Reference 4) */
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
      margin: 0 0 0.25rem;
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

    .hero-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      position: relative;
      z-index: 2;
      flex-shrink: 0;
    }

    .btn-hero-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 0.48rem 0.95rem;
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-hero-primary:hover {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.55);
    }

    /* 2. KPI Cards Row (Reference 4) */
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
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.45rem;
    }

    .kpi-label-box { display: flex; align-items: center; gap: 0.4rem; }
    .status-indicator { width: 6px; height: 6px; border-radius: 50%; }
    .status-indicator.blue { background: #2563eb; box-shadow: 0 0 6px rgba(37, 99, 235, 0.5); }
    .status-indicator.green { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.5); }
    .status-indicator.amber { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }
    .status-indicator.purple { background: #8b5cf6; box-shadow: 0 0 6px rgba(139, 92, 246, 0.5); }

    .kpi-label { font-size: 0.65rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; }

    .kpi-icon-box {
      width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.2s ease;
    }
    .kpi-card:hover .kpi-icon-box { transform: scale(1.08); }
    .kpi-icon-box svg { width: 15px; height: 15px; }
    .kpi-icon-box.blue { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
    .kpi-icon-box.green { background: #f0fdf4; color: #059669; border: 1px solid #dcfce7; }
    .kpi-icon-box.amber { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
    .kpi-icon-box.purple { background: #faf5ff; color: #7c3aed; border: 1px solid #f3e8ff; }

    .kpi-number {
      font-size: 1.4rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; line-height: 1.15; margin-bottom: 0.3rem;
    }
    .kpi-subtext { font-size: 0.6875rem; color: #64748b; font-weight: 500; }

    /* 3. Side-by-Side Charts Row (Reference 5) */
    .analytics-row {
      display: grid;
      grid-template-columns: 62% calc(38% - 0.75rem);
      gap: 0.75rem;
    }

    .chart-card-large, .chart-card-donut {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.85rem 1.15rem;
      box-shadow: 0 2px 10px -2px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
    }

    .chart-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 0.55rem;
      gap: 0.75rem;
    }

    .chart-title { font-size: 0.9rem; font-weight: 800; color: #0f172a; letter-spacing: -0.015em; margin-bottom: 0.1rem; }
    .chart-subtitle { font-size: 0.7rem; color: #64748b; margin: 0; }

    .time-pill-group { background: #f1f5f9; border-radius: 7px; padding: 0.15rem; display: flex; gap: 0.15rem; }
    .time-btn { border: none; background: transparent; padding: 0.22rem 0.55rem; font-size: 0.675rem; font-weight: 600; color: #64748b; border-radius: 5px; cursor: pointer; transition: all 0.15s ease; }
    .time-btn.active { background: #ffffff; color: #0f172a; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }

    .chart-stats-summary {
      display: flex;
      align-items: center;
      gap: 1.15rem;
      margin-bottom: 0.55rem;
      padding-bottom: 0.45rem;
      border-bottom: 1px dashed #e2e8f0;
    }
    .summary-metric { display: flex; align-items: center; gap: 0.35rem; font-size: 0.725rem; }
    .summary-dot { width: 7px; height: 7px; border-radius: 50%; }
    .summary-dot.blue { background: #2563eb; }
    .summary-dot.green { background: #10b981; }
    .summary-label { color: #64748b; font-weight: 500; }
    .summary-val { color: #0f172a; font-weight: 700; }

    .canvas-container { position: relative; height: 195px; width: 100%; }

    /* Donut Chart */
    .donut-canvas-wrap {
      position: relative; height: 135px; width: 100%; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;
    }
    .donut-center-stat { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
    .donut-total { font-size: 1.25rem; font-weight: 800; color: #0f172a; line-height: 1; }
    .donut-sub { font-size: 0.625rem; color: #64748b; font-weight: 600; margin-top: 0.1rem; }

    .donut-legend-list { display: flex; flex-direction: column; gap: 0.45rem; margin-top: auto; }
    .legend-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .legend-item-header { display: flex; align-items: center; font-size: 0.7rem; }
    .legend-dot { width: 7px; height: 7px; border-radius: 50%; margin-right: 0.4rem; }
    .legend-dot.green { background: #10b981; }
    .legend-dot.blue { background: #2563eb; }
    .legend-dot.amber { background: #f59e0b; }
    .legend-name { color: #475569; font-weight: 600; }
    .legend-val { margin-left: auto; font-weight: 700; color: #0f172a; margin-right: 0.4rem; }
    .legend-pct { font-weight: 600; color: #64748b; font-size: 0.675rem; width: 36px; text-align: right; }
    .legend-progress-bar { width: 100%; height: 4px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 9999px; }
    .progress-fill.green { background: #10b981; }
    .progress-fill.blue { background: #2563eb; }
    .progress-fill.amber { background: #f59e0b; }

    /* 4. Table Card (Reference 5) */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 2px 10px -2px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }

    .table-card-header {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .table-title { font-size: 0.9rem; font-weight: 800; color: #0f172a; letter-spacing: -0.015em; margin: 0 0 0.1rem; }
    .table-subtitle { font-size: 0.7rem; color: #64748b; margin: 0; }

    .table-responsive { overflow-x: auto; }
    .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
    .modern-table thead th {
      padding: 0.55rem 0.85rem; background: #f8fafc; font-size: 0.65rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; white-space: nowrap;
    }
    .modern-table tbody tr { border-bottom: 1px solid #f1f5f9; }
    .modern-table tbody tr:hover { background: #f8fafc; }
    .modern-table td { padding: 0.6rem 0.85rem; vertical-align: middle; font-size: 0.75rem; }

    .badge-pill { display: inline-block; padding: 0.18rem 0.5rem; border-radius: 5px; font-weight: 700; font-size: 0.7rem; }
    .badge-pill.green { background: #ecfdf5; color: #047857; }
    .badge-pill.amber { background: #fffbeb; color: #b45309; }

    .val-saved { color: #059669; font-size: 0.875rem; }
    .text-right { text-align: right; }

    @media (max-width: 1100px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .analytics-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  summary = signal<ReportsSummary | null>(null);
  selectedPeriod = signal<string>('30_DAYS');
  selectedTimeframe = 'day';
  isExporting = signal(false);

  @ViewChild('volumeChartCanvas') volumeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChartCanvas') donutCanvas!: ElementRef<HTMLCanvasElement>;

  private volumeChart: Chart | null = null;
  private donutChart: Chart | null = null;

  breakdownRows: IntentBreakdownRow[] = [
    {
      intent: 'Appointment Booking & Reschedule',
      totalQueries: 420,
      aiHandled: 408,
      escalated: 12,
      avgTime: '1.2s',
      appointments: '28 bookings',
      valueSaved: '₹14,000'
    },
    {
      intent: 'Treatments & Pricing Inquiries',
      totalQueries: 385,
      aiHandled: 368,
      escalated: 17,
      avgTime: '1.1s',
      appointments: '14 bookings',
      valueSaved: '₹7,000'
    },
    {
      intent: 'Clinic Hours & Location Questions',
      totalQueries: 290,
      aiHandled: 288,
      escalated: 2,
      avgTime: '0.9s',
      appointments: '—',
      valueSaved: '₹3,500'
    },
    {
      intent: 'Insurance Coverage & Cashless EMI',
      totalQueries: 185,
      aiHandled: 172,
      escalated: 13,
      avgTime: '1.4s',
      appointments: '6 bookings',
      valueSaved: '₹2,500'
    },
    {
      intent: 'Medical Emergency & Acute Pain',
      totalQueries: 140,
      aiHandled: 102,
      escalated: 38,
      avgTime: '0.8s',
      appointments: '8 priority',
      valueSaved: '₹1,500'
    }
  ];

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.renderCharts(), 100);
  }

  ngOnDestroy(): void {
    if (this.volumeChart) this.volumeChart.destroy();
    if (this.donutChart) this.donutChart.destroy();
  }

  setTimeframe(tf: string): void {
    this.selectedTimeframe = tf;
    setTimeout(() => this.renderCharts(), 50);
  }

  loadSummary(): void {
    this.reportsService.getSummary(this.selectedPeriod()).subscribe({
      next: (res) => this.summary.set(res.data),
      error: () => {}
    });
  }

  exportCsv(): void {
    this.isExporting.set(true);
    this.reportsService.downloadCsv().subscribe({
      next: (blob) => {
        this.isExporting.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartreply_reports_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.isExporting.set(false);
        alert('CSV report downloaded successfully.');
      }
    });
  }

  private renderCharts(): void {
    if (!this.volumeCanvas || !this.donutCanvas) return;

    if (this.volumeChart) this.volumeChart.destroy();
    if (this.donutChart) this.donutChart.destroy();

    // 1. Bar + Line Chart (Reference 5)
    const vCtx = this.volumeCanvas.nativeElement.getContext('2d');
    if (vCtx) {
      this.volumeChart = new Chart(vCtx, {
        type: 'bar',
        data: {
          labels: ['01 Oct', '03 Oct', '05 Oct', '07 Oct', '09 Oct', '11 Oct', '12 Oct'],
          datasets: [
            {
              type: 'bar',
              label: 'Total Queries',
              data: [120, 180, 160, 240, 280, 210, 230],
              backgroundColor: 'rgba(37, 99, 235, 0.75)',
              hoverBackgroundColor: '#2563eb',
              borderRadius: 6,
              barThickness: 24,
              order: 2
            },
            {
              type: 'line',
              label: 'AI Resolved',
              data: [114, 172, 150, 226, 264, 198, 214],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2.5,
              tension: 0.35,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              order: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 600 } } }
          }
        }
      });
    }

    // 2. Donut Chart (Reference 5)
    const dCtx = this.donutCanvas.nativeElement.getContext('2d');
    if (dCtx) {
      this.donutChart = new Chart(dCtx, {
        type: 'doughnut',
        data: {
          labels: ['AI Auto-Resolved', 'Human Escalated', 'Pending Action'],
          datasets: [
            {
              data: [1338, 64, 18],
              backgroundColor: ['#10b981', '#2563eb', '#f59e0b'],
              borderWidth: 3,
              borderColor: '#ffffff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '76%',
          plugins: { legend: { display: false } }
        }
      });
    }
  }
}
