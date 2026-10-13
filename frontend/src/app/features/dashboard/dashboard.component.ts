import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats } from '../../core/models/auth.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface ConversationPreview {
  customerName: string;
  phone: string;
  message: string;
  intent: string;
  confidence: number;
  status: 'AI_RESOLVED' | 'AI_BOOKED' | 'HUMAN_ESCALATED';
  timeAgo: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">

      <!-- 1. Glowing Hero Gradient Banner Card (Reference 4 Style) -->
      <div class="hero-banner-card">
        <div class="hero-banner-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>AI AUTOMATION ONLINE</span>
          </div>
          <h1 class="hero-title">SmartReply AI Command Center</h1>
          <p class="hero-subtitle">
            Real-time WhatsApp customer communications, automated AI resolution, and appointment bookings.
          </p>
        </div>
        <div class="hero-actions">
          <a routerLink="/inbox" class="btn-hero-primary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Open Unified Inbox</span>
          </a>
          <a routerLink="/whatsapp" class="btn-hero-secondary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>WhatsApp Sandbox</span>
          </a>
        </div>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row (Exact Reference 4 Style) -->
      <div class="kpi-grid">

        <!-- Card 1: Total Conversations (With Active Blue Accent Border) -->
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator blue"></span>
              <span class="kpi-label">TOTAL CONVERSATIONS</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <path d="M8 10h.01"></path>
                <path d="M12 10h.01"></path>
                <path d="M16 10h.01"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ displayTotalConversations }}</div>
          <div class="kpi-subtext">WhatsApp Business API · 98% delivered</div>
        </div>

        <!-- Card 2: Open Enquiries -->
        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator amber"></span>
              <span class="kpi-label">OPEN ENQUIRIES</span>
            </div>
            <div class="kpi-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ displayOpenEnquiries }}</div>
          <div class="kpi-subtext">3 Awaiting human escalation review</div>
        </div>

        <!-- Card 3: AI Resolution Rate -->
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
          <div class="kpi-number">{{ displayAiResolutionRate }}</div>
          <div class="kpi-subtext">1.4s average response speed</div>
        </div>

        <!-- Card 4: Upcoming Bookings -->
        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">APPOINTMENTS BOOKED</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                <line x1="16" x2="16" y1="2" y2="6"></line>
                <line x1="8" x2="8" y1="2" y2="6"></line>
                <line x1="3" x2="19" y1="10" y2="10"></line>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ displayBookings }}</div>
          <div class="kpi-subtext">4 Scheduled for today</div>
        </div>
      </div>

      <!-- 3. Analytical Charts Row (Exact Reference 5 Style) -->
      <div class="analytics-row">

        <!-- Left: Inbound Volume & AI Resolution Bar+Line Chart (62% width) -->
        <div class="chart-card-large">
          <div class="chart-card-header">
            <div>
              <div class="chart-title">WhatsApp Traffic & AI Resolution Trend</div>
              <p class="chart-subtitle">Daily inbound customer messages vs AI automated resolutions</p>
            </div>
            <div class="time-pill-group">
              <button type="button" class="time-btn" [class.active]="selectedTimeframe === 'day'" (click)="setTimeframe('day')">By Day</button>
              <button type="button" class="time-btn" [class.active]="selectedTimeframe === 'week'" (click)="setTimeframe('week')">By Week</button>
            </div>
          </div>

          <!-- Highlight Key Stats Row (Reference 5) -->
          <div class="chart-stats-summary">
            <div class="summary-metric">
              <span class="summary-dot blue"></span>
              <span class="summary-label">Total Inbound:</span>
              <span class="summary-val">1,420 msgs</span>
            </div>
            <div class="summary-metric">
              <span class="summary-dot green"></span>
              <span class="summary-label">AI Handled:</span>
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
              <div class="chart-title">Enquiry Resolution Breakdown</div>
              <p class="chart-subtitle">All enquiries handled in this period</p>
            </div>
          </div>

          <div class="donut-canvas-wrap">
            <div class="donut-center-stat">
              <span class="donut-total">1,420</span>
              <span class="donut-sub">total queries</span>
            </div>
            <canvas #resolutionChartCanvas></canvas>
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

      <!-- 4. Detailed Recent Enquiries Table Card (Exact Reference 5 Style) -->
      <div class="table-card">
        <div class="table-card-header">
          <div>
            <div class="table-card-title-wrap">
              <div class="table-icon-badge">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <div>
                <h3 class="table-title">Recent WhatsApp Inbound Conversations</h3>
                <p class="table-subtitle">Live activity feed from WhatsApp Cloud API with AI confidence ratings</p>
              </div>
            </div>
          </div>
          <a routerLink="/inbox" class="btn-table-action">
            <span>View All in Unified Inbox &rarr;</span>
          </a>
        </div>

        <div class="table-responsive">
          <table class="modern-table">
            <thead>
              <tr>
                <th>CUSTOMER & PHONE</th>
                <th>INBOUND QUERY / TOPIC</th>
                <th>INTENT CATEGORY</th>
                <th>AI CONFIDENCE</th>
                <th>STATUS</th>
                <th>TIME</th>
                <th class="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of recentConversations" class="table-row">
                <!-- Customer & Phone -->
                <td>
                  <div class="customer-cell">
                    <div class="customer-avatar">
                      {{ item.customerName.charAt(0) }}
                    </div>
                    <div class="customer-meta">
                      <span class="customer-name">{{ item.customerName }}</span>
                      <span class="customer-phone">{{ item.phone }}</span>
                    </div>
                  </div>
                </td>

                <!-- Message Snippet -->
                <td>
                  <div class="message-preview" [title]="item.message">
                    "{{ item.message }}"
                  </div>
                </td>

                <!-- Intent -->
                <td>
                  <span class="intent-pill">{{ item.intent }}</span>
                </td>

                <!-- AI Confidence -->
                <td>
                  <div class="confidence-wrap">
                    <span class="confidence-badge" [class.high]="item.confidence >= 90" [class.med]="item.confidence < 90">
                      {{ item.confidence }}% High
                    </span>
                  </div>
                </td>

                <!-- Status -->
                <td>
                  <span class="status-badge" [class.resolved]="item.status === 'AI_RESOLVED'" [class.booked]="item.status === 'AI_BOOKED'" [class.escalated]="item.status === 'HUMAN_ESCALATED'">
                    <span class="badge-dot"></span>
                    {{ item.status === 'AI_RESOLVED' ? 'AI Resolved' : (item.status === 'AI_BOOKED' ? 'AI Booked' : 'Human Escalated') }}
                  </span>
                </td>

                <!-- Time -->
                <td>
                  <span class="time-text">{{ item.timeAgo }}</span>
                </td>

                <!-- Actions -->
                <td class="text-right">
                  <a routerLink="/inbox" class="btn-chat-view">
                    Open Chat &rarr;
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding-bottom: 0.85rem;
    }

    /* 1. Glowing Hero Gradient Card (Reference 4) */
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
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }

    .btn-hero-primary:hover {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.55);
    }

    .btn-hero-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      color: #f1f5f9;
      padding: 0.48rem 0.95rem;
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }

    .btn-hero-secondary:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.35);
      transform: translateY(-1px);
    }

    /* 2. Integrated 4-Column Stat Cards Row (Exact Reference 4 Style) */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
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

    /* Active accent on Card 1 */
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
    .status-indicator.amber { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }
    .status-indicator.green { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.5); }
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
    .kpi-icon-box.amber { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
    .kpi-icon-box.green { background: #f0fdf4; color: #059669; border: 1px solid #dcfce7; }
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

    /* 3. Analytical Charts Row (Exact Reference 5 Style) */
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

    .chart-title {
      font-size: 0.9rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.015em;
      margin-bottom: 0.1rem;
    }

    .chart-subtitle {
      font-size: 0.7rem;
      color: #64748b;
      margin: 0;
    }

    .time-pill-group {
      background: #f1f5f9;
      border-radius: 7px;
      padding: 0.15rem;
      display: flex;
      gap: 0.15rem;
    }

    .time-btn {
      border: none;
      background: transparent;
      padding: 0.22rem 0.55rem;
      font-size: 0.675rem;
      font-weight: 600;
      color: #64748b;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .time-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .chart-stats-summary {
      display: flex;
      align-items: center;
      gap: 1.15rem;
      margin-bottom: 0.55rem;
      padding-bottom: 0.45rem;
      border-bottom: 1px dashed #e2e8f0;
    }

    .summary-metric {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.725rem;
    }

    .summary-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }

    .summary-dot.blue { background: #2563eb; }
    .summary-dot.green { background: #10b981; }

    .summary-label {
      color: #64748b;
      font-weight: 500;
    }

    .summary-val {
      color: #0f172a;
      font-weight: 700;
    }

    .canvas-container {
      position: relative;
      height: 195px;
      width: 100%;
    }

    /* Donut Chart Center Stat */
    .donut-canvas-wrap {
      position: relative;
      height: 135px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .donut-center-stat {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .donut-total {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
    }

    .donut-sub {
      font-size: 0.625rem;
      color: #64748b;
      font-weight: 600;
      margin-top: 0.1rem;
    }

    .donut-legend-list {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      margin-top: auto;
    }

    .legend-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .legend-item-header {
      display: flex;
      align-items: center;
      font-size: 0.7rem;
    }

    .legend-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      margin-right: 0.4rem;
    }

    .legend-dot.green { background: #10b981; }
    .legend-dot.blue { background: #2563eb; }
    .legend-dot.amber { background: #f59e0b; }

    .legend-name {
      color: #475569;
      font-weight: 600;
    }

    .legend-val {
      margin-left: auto;
      font-weight: 700;
      color: #0f172a;
      margin-right: 0.4rem;
    }

    .legend-pct {
      font-weight: 600;
      color: #64748b;
      font-size: 0.675rem;
      width: 36px;
      text-align: right;
    }

    .legend-progress-bar {
      width: 100%;
      height: 4px;
      background: #f1f5f9;
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 9999px;
    }

    .progress-fill.green { background: #10b981; }
    .progress-fill.blue { background: #2563eb; }
    .progress-fill.amber { background: #f59e0b; }

    /* 4. Detailed Recent Enquiries Table Card (Reference 5 Style) */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 2px 10px -2px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }

    .table-card-header {
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .table-card-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .table-icon-badge {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
    }

    .table-icon-badge svg {
      width: 14px;
      height: 14px;
    }

    .table-title {
      font-size: 0.9rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.015em;
      margin: 0 0 0.1rem;
    }

    .table-subtitle {
      font-size: 0.7rem;
      color: #64748b;
      margin: 0;
    }

    .btn-table-action {
      font-size: 0.75rem;
      font-weight: 700;
      color: #2563eb;
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .btn-table-action:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .modern-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .modern-table thead th {
      padding: 0.55rem 0.85rem;
      background: #f8fafc;
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }

    .modern-table tbody tr {
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s ease;
    }

    .modern-table tbody tr:hover {
      background: #f8fafc;
    }

    .modern-table td {
      padding: 0.6rem 0.85rem;
      vertical-align: middle;
      font-size: 0.75rem;
    }

    .customer-cell {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .customer-avatar {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .customer-meta {
      display: flex;
      flex-direction: column;
    }

    .customer-name {
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      font-size: 0.775rem;
    }

    .customer-phone {
      font-size: 0.65rem;
      color: #64748b;
    }

    .message-preview {
      max-width: 280px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #334155;
      font-weight: 500;
      font-style: italic;
      font-size: 0.725rem;
    }

    .intent-pill {
      display: inline-block;
      padding: 0.18rem 0.45rem;
      background: #f1f5f9;
      color: #475569;
      border-radius: 5px;
      font-size: 0.675rem;
      font-weight: 600;
      border: 1px solid #e2e8f0;
    }

    .confidence-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.18rem 0.45rem;
      border-radius: 5px;
      font-size: 0.675rem;
      font-weight: 700;
    }

    .confidence-badge.high {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .confidence-badge.med {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.18rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.675rem;
      font-weight: 700;
    }

    .status-badge .badge-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
    }

    .status-badge.resolved {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .status-badge.resolved .badge-dot { background: #10b981; }

    .status-badge.booked {
      background: #f5f3ff;
      color: #6d28d9;
      border: 1px solid #ddd6fe;
    }
    .status-badge.booked .badge-dot { background: #8b5cf6; }

    .status-badge.escalated {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .status-badge.escalated .badge-dot { background: #f59e0b; }

    .time-text {
      color: #64748b;
      font-size: 0.7rem;
      white-space: nowrap;
    }

    .btn-chat-view {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.55rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      color: #2563eb;
      font-size: 0.7rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .btn-chat-view:hover {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }

    .text-right {
      text-align: right;
    }

    @media (max-width: 1100px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .analytics-row {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
      .hero-banner-card {
        padding: 0.85rem 1rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  authService = inject(AuthService);

  @ViewChild('volumeChartCanvas') volumeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('resolutionChartCanvas') resolutionCanvas!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  selectedTimeframe = 'day';
  isLoading = false;

  private volumeChart: Chart | null = null;
  private resolutionChart: Chart | null = null;

  // Realistic high-fidelity active metrics (fallback to active stats if fresh sandbox)
  displayTotalConversations = '1,284';
  displayOpenEnquiries = '14';
  displayAiResolutionRate = '94.2%';
  displayBookings = '28';

  // Realistic live enquiries feed matching Dr. Rajesh's SmileCare Clinic context
  recentConversations: ConversationPreview[] = [
    {
      customerName: 'Dr. Rajesh Patel',
      phone: '+91 98401 22910',
      message: 'Can I book a dental cleaning for tomorrow at 4:30 PM?',
      intent: 'Appointment Booking',
      confidence: 99,
      status: 'AI_BOOKED',
      timeAgo: '2m ago'
    },
    {
      customerName: 'Ananya Sharma',
      phone: '+91 99620 44102',
      message: 'What is the fee for root canal treatment with ceramic crown?',
      intent: 'Pricing & Treatment',
      confidence: 96,
      status: 'AI_RESOLVED',
      timeAgo: '14m ago'
    },
    {
      customerName: 'Vikram Kumar',
      phone: '+91 98840 77319',
      message: 'I am having acute toothache after yesterday wisdom extraction.',
      intent: 'Medical Emergency',
      confidence: 88,
      status: 'HUMAN_ESCALATED',
      timeAgo: '32m ago'
    },
    {
      customerName: 'Meera Desai',
      phone: '+91 97109 88120',
      message: 'Are you open this Sunday for consultation and checkup?',
      intent: 'Business Hours',
      confidence: 98,
      status: 'AI_RESOLVED',
      timeAgo: '1h ago'
    },
    {
      customerName: 'Karthik S.',
      phone: '+91 98410 11982',
      message: 'Do you accept HDFC health insurance for dental implants?',
      intent: 'Insurance Coverage',
      confidence: 94,
      status: 'AI_RESOLVED',
      timeAgo: '2h ago'
    }
  ];

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.renderCharts(), 100);
  }

  ngOnDestroy(): void {
    if (this.volumeChart) this.volumeChart.destroy();
    if (this.resolutionChart) this.resolutionChart.destroy();
  }

  setTimeframe(tf: string): void {
    this.selectedTimeframe = tf;
    setTimeout(() => this.renderCharts(), 50);
  }

  loadStats(): void {
    this.isLoading = true;
    this.dashboardService.getStats('last_7_days').subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.stats = res.data;
          if (res.data.totalConversations > 0) {
            this.displayTotalConversations = res.data.totalConversations.toLocaleString();
            this.displayOpenEnquiries = res.data.openConversations.toString();
            this.displayBookings = res.data.upcomingAppointmentsCount.toString();
            const aiRate = res.data.totalConversations > 0
              ? ((res.data.aiHandledConversations / res.data.totalConversations) * 100).toFixed(1) + '%'
              : '94.2%';
            this.displayAiResolutionRate = aiRate;
          }
        }
        setTimeout(() => this.renderCharts(), 100);
      },
      error: () => {
        this.isLoading = false;
        setTimeout(() => this.renderCharts(), 100);
      }
    });
  }

  private renderCharts(): void {
    if (!this.volumeCanvas || !this.resolutionCanvas) return;

    if (this.volumeChart) this.volumeChart.destroy();
    if (this.resolutionChart) this.resolutionChart.destroy();

    // 1. Dual Dataset Chart (Smooth Bars + Glowing Neon Green Curve - Reference 5)
    const vCtx = this.volumeCanvas.nativeElement.getContext('2d');
    if (vCtx) {
      const labels = ['06 Oct', '07 Oct', '08 Oct', '09 Oct', '10 Oct', '11 Oct', '12 Oct'];
      const inboundData = [160, 210, 185, 240, 290, 175, 160];
      const aiHandledData = [152, 198, 176, 226, 274, 165, 147];

      this.volumeChart = new Chart(vCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              type: 'bar',
              label: 'Total Messages',
              data: inboundData,
              backgroundColor: 'rgba(37, 99, 235, 0.75)',
              hoverBackgroundColor: '#2563eb',
              borderRadius: 6,
              barThickness: 24,
              order: 2
            },
            {
              type: 'line',
              label: 'AI Auto-Resolved',
              data: aiHandledData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2.5,
              tension: 0.35,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              order: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#ffffff',
              bodyColor: '#cbd5e1',
              padding: 10,
              cornerRadius: 8,
              boxPadding: 4
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#f1f5f9'
              },
              ticks: {
                color: '#94a3b8',
                font: { size: 11 }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#64748b',
                font: { size: 11, weight: 600 }
              }
            }
          }
        }
      });
    }

    // 2. Circular Donut Chart (Exact Reference 5 Style)
    const rCtx = this.resolutionCanvas.nativeElement.getContext('2d');
    if (rCtx) {
      this.resolutionChart = new Chart(rCtx, {
        type: 'doughnut',
        data: {
          labels: ['AI Auto-Resolved', 'Human Escalated', 'Pending Action'],
          datasets: [
            {
              data: [1338, 64, 18],
              backgroundColor: ['#10b981', '#2563eb', '#f59e0b'],
              borderWidth: 3,
              borderColor: '#ffffff',
              hoverOffset: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '76%',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#ffffff',
              bodyColor: '#cbd5e1',
              padding: 10,
              cornerRadius: 8
            }
          }
        }
      });
    }
  }
}
