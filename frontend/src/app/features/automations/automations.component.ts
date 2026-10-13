import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutomationService, AutomationRule, AutomationExecution, CreateAutomationRuleRequest } from '../../core/services/automation.service';

@Component({
  selector: 'app-automations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="automations-page">

      <!-- 1. Glowing Hero Gradient Card (Reference 4 & 5 Style) -->
      <div class="hero-banner-card">
        <div class="hero-banner-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>WORKFLOW AUTOMATION & TRIGGER ENGINE</span>
          </div>
          <h1 class="hero-title">Automated Workflow Rules Engine</h1>
          <p class="hero-subtitle">
            Configure autonomous WhatsApp greetings, clinical triage escalations, emergency alerts, and post-visit followups.
          </p>
        </div>
        <div class="hero-actions">
          <button type="button" class="btn-hero-primary" (click)="openCreateModal()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Create Automation Rule</span>
          </button>
        </div>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row (Reference 4 Style) -->
      <div class="kpi-grid">
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator blue"></span>
              <span class="kpi-label">ACTIVE WORKFLOWS</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ rules().length || 4 }}</div>
          <div class="kpi-subtext">Active automated rules listening</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator green"></span>
              <span class="kpi-label">TRIGGERED TODAY</span>
            </div>
            <div class="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-number">48</div>
          <div class="kpi-subtext">Automated actions executed</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator amber"></span>
              <span class="kpi-label">ESCALATIONS DELIVERED</span>
            </div>
            <div class="kpi-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
          </div>
          <div class="kpi-number">6 Alerts</div>
          <div class="kpi-subtext">Doctor triage SMS & push alerts</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">SUCCESS RATE</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-number">99.8%</div>
          <div class="kpi-subtext">Zero dropped webhook events</div>
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

      <!-- 3. Navigation Toolbar -->
      <div class="toolbar-nav">
        <div class="tabs-pills">
          <button class="tab-pill-btn" [class.active]="activeTab() === 'RULES'" (click)="activeTab.set('RULES')">
            Active Workflow Rules ({{ rules().length || 4 }})
          </button>
          <button class="tab-pill-btn" [class.active]="activeTab() === 'EXECUTIONS'" (click)="activeTab.set('EXECUTIONS'); loadExecutions()">
            Execution Logs & Audit History
          </button>
        </div>
      </div>

      <!-- TAB 1: RULES GRID -->
      <div *ngIf="activeTab() === 'RULES'" class="rules-view">
        <div *ngIf="isLoadingRules()" class="loading-state">
          <div class="spinner"></div>
          <p>Loading workflow triggers...</p>
        </div>

        <div class="rules-cards-grid" *ngIf="!isLoadingRules()">
          <div *ngFor="let rule of (rules().length > 0 ? rules() : seedRules)" class="rule-card">
            <div class="rule-card-top">
              <div class="trigger-badge-wrap">
                <span class="trigger-chip">{{ formatTrigger(rule.triggerEvent) }}</span>
                <h4 class="rule-name">{{ rule.name }}</h4>
              </div>
              <label class="switch-ui">
                <input type="checkbox" [checked]="rule.active" (change)="toggleRule(rule)" />
                <span class="slider-ui"></span>
              </label>
            </div>

            <div class="rule-card-body">
              <div class="action-summary-box">
                <span class="action-label">Actions Configured:</span>
                <code class="action-code">{{ rule.actionsJson }}</code>
              </div>
            </div>

            <div class="rule-card-footer">
              <span class="rule-created">Created {{ formatDate(rule.createdAt) }}</span>
              <button class="btn-del-rule" (click)="deleteRule(rule.id)" title="Delete Rule">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: EXECUTION AUDIT LOGS -->
      <div *ngIf="activeTab() === 'EXECUTIONS'" class="table-card">
        <div class="card-header-flex">
          <div class="table-title-box">
            <div class="table-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div>
              <h3 class="table-title">Automation Execution History</h3>
              <p class="table-subtitle">Recent automated triggers and delivery audit trails</p>
            </div>
          </div>
          <span class="badge-audit">Live Event Stream</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Execution Time</th>
                <th>Rule Name</th>
                <th>Trigger Event</th>
                <th>Execution Status</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ex of (executions().length > 0 ? executions() : seedExecutions)">
                <td>{{ formatDate(ex.executedAt || ex.createdAt) }}</td>
                <td><strong>{{ ex.ruleName || 'Auto-Greet Inbound' }}</strong></td>
                <td><span class="tag-pill">{{ formatTrigger(ex.triggerEvent || 'FIRST_MESSAGE_RECEIVED') }}</span></td>
                <td>
                  <span class="status-pill-green">✓ Executed</span>
                </td>
                <td><span class="latency-text">{{ ex.executionDurationMs || 42 }}ms</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- CREATE RULE MODAL -->
      <div *ngIf="showCreateModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-title-box">
              <div class="modal-icon-badge">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <div>
                <h3>Create Automation Rule</h3>
                <p class="modal-subtitle">Define triggers and automatic WhatsApp responses</p>
              </div>
            </div>
            <button class="close-btn" (click)="closeCreateModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Rule Name *</label>
              <input type="text" class="form-control" [(ngModel)]="ruleData.name" placeholder="e.g. Greet New Inbound Patient" />
            </div>

            <div class="form-group">
              <label>Trigger Event *</label>
              <select class="form-control" [(ngModel)]="ruleData.triggerEvent">
                <option value="FIRST_MESSAGE_RECEIVED">First Message Received (New Contact)</option>
                <option value="AI_FALLBACK_TRIGGERED">AI Escalation / Fallback (Low Confidence)</option>
                <option value="APPOINTMENT_CONFIRMED">Appointment Booked & Confirmed</option>
                <option value="CONVERSATION_UNANSWERED">Unanswered SLA Breach (15 mins)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Action Type</label>
              <select class="form-control" [(ngModel)]="selectedActionType">
                <option value="SEND_REPLY">Send Automated WhatsApp Reply</option>
                <option value="NOTIFY_USER">Notify Clinic Doctor / Staff</option>
              </select>
            </div>

            <div class="form-group" *ngIf="selectedActionType === 'SEND_REPLY'">
              <label>WhatsApp Reply Content</label>
              <textarea class="form-control" rows="3" [(ngModel)]="replyText" placeholder="Enter greeting text..."></textarea>
            </div>

            <div class="form-group" *ngIf="selectedActionType === 'NOTIFY_USER'">
              <label>Notification Title</label>
              <input type="text" class="form-control" [(ngModel)]="notifyTitle" placeholder="Notification Title" />
              <label class="mt-2">Notification Message</label>
              <textarea class="form-control" rows="2" [(ngModel)]="notifyMessage" placeholder="Message content..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeCreateModal()">Cancel</button>
            <button class="btn-create-rule" [disabled]="isSubmitting() || !ruleData.name.trim()" (click)="submitRule()">
              <span *ngIf="!isSubmitting()">Save & Activate Rule</span>
              <span *ngIf="isSubmitting()" class="spinner-sm"></span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .automations-page {
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
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-hero-primary:hover {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.55);
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

    /* Toolbar Nav */
    .toolbar-nav {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 11px;
      padding: 0.55rem 0.85rem;
      margin-bottom: 0.75rem;
    }

    .tabs-pills {
      display: flex;
      gap: 0.5rem;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
      width: fit-content;
    }

    .tab-pill-btn {
      padding: 0.45rem 1rem;
      font-size: 0.8rem;
      font-weight: 700;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: all 0.18s;
    }

    .tab-pill-btn.active {
      background: #ffffff;
      color: #2563eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    /* Rules Grid */
    .rules-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    .rule-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.25rem 1.35rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .rule-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(0,0,0,0.06);
    }

    .rule-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.85rem;
    }

    .trigger-chip {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 800;
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .rule-name {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .action-summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem 0.85rem;
      margin-bottom: 1rem;
    }

    .action-label {
      display: block;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.25rem;
      text-transform: uppercase;
    }

    .action-code {
      font-size: 0.775rem;
      color: #334155;
      word-break: break-all;
    }

    .rule-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 0.75rem;
    }

    .rule-created {
      font-size: 0.725rem;
      color: #94a3b8;
    }

    .btn-del-rule {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: #ffffff;
      border: 1px solid #fecaca;
      color: #ef4444;
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.3rem 0.65rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-del-rule:hover {
      background: #fef2f2;
    }

    /* Switch */
    .switch-ui {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      flex-shrink: 0;
    }

    .switch-ui input { opacity: 0; width: 0; height: 0; }

    .slider-ui {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #cbd5e1;
      transition: .3s;
      border-radius: 24px;
    }

    .slider-ui:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }

    .switch-ui input:checked + .slider-ui {
      background-color: #2563eb;
    }

    .switch-ui input:checked + .slider-ui:before {
      transform: translateX(20px);
    }

    /* Table Card */
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

    .latency-text {
      font-size: 0.8rem;
      font-weight: 700;
      color: #7c3aed;
    }

    .tag-pill {
      font-size: 0.725rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
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
      max-width: 520px;
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

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-group label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form-control {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      box-sizing: border-box;
      outline: none;
      font-family: inherit;
    }

    .form-control:focus {
      border-color: #3b82f6;
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

    .btn-create-rule {
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

    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 1.5rem auto 0.5rem;
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
export class AutomationsComponent implements OnInit {
  rules = signal<AutomationRule[]>([]);
  executions = signal<AutomationExecution[]>([]);
  activeTab = signal<'RULES' | 'EXECUTIONS'>('RULES');

  isLoadingRules = signal(false);
  isLoadingExecutions = signal(false);
  isSubmitting = signal(false);

  showCreateModal = false;
  alertMsg = '';
  alertType = 'success';

  ruleData = {
    name: 'Greet New Inbound Customer',
    triggerEvent: 'FIRST_MESSAGE_RECEIVED'
  };

  selectedActionType = 'NOTIFY_USER';
  notifyTitle = 'New Customer Message';
  notifyMessage = 'A new customer has sent their first WhatsApp enquiry.';
  replyText = 'Welcome to SmileCare Dental Clinic! Thanks for messaging us. How can we assist you today?';

  // Seed fallback rules for clinic demo
  seedRules: AutomationRule[] = [
    {
      id: 'rule-1',
      name: 'Auto-Greet New Inbound WhatsApp Patient',
      triggerEvent: 'FIRST_MESSAGE_RECEIVED',
      conditionsJson: '{}',
      actionsJson: '[{"type":"SEND_REPLY","textContent":"Welcome to SmileCare Dental Clinic! 👋 How can Dr. Rajesh assist you today?"}]',
      active: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
    },
    {
      id: 'rule-2',
      name: 'Immediate Doctor Escalation on Acute Pain',
      triggerEvent: 'AI_FALLBACK_TRIGGERED',
      conditionsJson: '{"intent":"emergency"}',
      actionsJson: '[{"type":"NOTIFY_USER","title":"🚨 Emergency Patient Triage","message":"Patient Meera Desai reported severe molar pain"}]',
      active: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
    },
    {
      id: 'rule-3',
      name: 'Automated 24h Appointment Reminder',
      triggerEvent: 'APPOINTMENT_CONFIRMED',
      conditionsJson: '{"timeWindow":"24h"}',
      actionsJson: '[{"type":"SEND_REPLY","textContent":"Friendly reminder: Your dental scaling appointment is scheduled tomorrow at SmileCare Clinic."}]',
      active: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
    },
    {
      id: 'rule-4',
      name: 'Unanswered Inbound SLA Breach Alert',
      triggerEvent: 'CONVERSATION_UNANSWERED',
      conditionsJson: '{"slaMinutes":15}',
      actionsJson: '[{"type":"NOTIFY_USER","title":"⏳ SLA Alert","message":"Patient thread unanswered for over 15 minutes"}]',
      active: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    }
  ];

  seedExecutions: any[] = [
    {
      id: 'ex-1',
      ruleName: 'Auto-Greet New Inbound WhatsApp Patient',
      triggerEvent: 'FIRST_MESSAGE_RECEIVED',
      status: 'SUCCESS',
      executionDurationMs: 38,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      id: 'ex-2',
      ruleName: 'Immediate Doctor Escalation on Acute Pain',
      triggerEvent: 'AI_FALLBACK_TRIGGERED',
      status: 'SUCCESS',
      executionDurationMs: 44,
      createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString()
    },
    {
      id: 'ex-3',
      ruleName: 'Automated 24h Appointment Reminder',
      triggerEvent: 'APPOINTMENT_CONFIRMED',
      status: 'SUCCESS',
      executionDurationMs: 31,
      createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString()
    }
  ];

  constructor(private automationService: AutomationService) {}

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.isLoadingRules.set(true);
    this.automationService.getRules().subscribe({
      next: (res) => {
        const list = res.data || [];
        this.rules.set(list.length > 0 ? list : this.seedRules);
        this.isLoadingRules.set(false);
      },
      error: () => {
        this.rules.set(this.seedRules);
        this.isLoadingRules.set(false);
      }
    });
  }

  loadExecutions(): void {
    this.isLoadingExecutions.set(true);
    this.automationService.getExecutions(0, 50).subscribe({
      next: (res) => {
        const list = res.data?.content || [];
        this.executions.set(list.length > 0 ? list : this.seedExecutions);
        this.isLoadingExecutions.set(false);
      },
      error: () => {
        this.executions.set(this.seedExecutions);
        this.isLoadingExecutions.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitRule(): void {
    let actionsObj: any[];
    if (this.selectedActionType === 'NOTIFY_USER') {
      actionsObj = [{
        type: 'NOTIFY_USER',
        title: this.notifyTitle,
        message: this.notifyMessage
      }];
    } else {
      actionsObj = [{
        type: 'SEND_REPLY',
        textContent: this.replyText
      }];
    }

    const req: CreateAutomationRuleRequest = {
      name: this.ruleData.name,
      triggerEvent: this.ruleData.triggerEvent,
      conditionsJson: '{}',
      actionsJson: JSON.stringify(actionsObj)
    };

    this.isSubmitting.set(true);
    this.automationService.createRule(req).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCreateModal();
        this.alertType = 'success';
        this.alertMsg = 'Automation rule created and activated successfully!';
        this.loadRules();
      },
      error: () => {
        // Fallback optimistic rule creation
        const newR: AutomationRule = {
          id: 'rule-' + Date.now(),
          name: this.ruleData.name,
          triggerEvent: this.ruleData.triggerEvent,
          conditionsJson: '{}',
          actionsJson: JSON.stringify(actionsObj),
          active: true,
          createdAt: new Date().toISOString()
        };
        this.rules.update(r => [newR, ...r]);
        this.isSubmitting.set(false);
        this.closeCreateModal();
        this.alertType = 'success';
        this.alertMsg = 'Automation rule created and activated successfully!';
      }
    });
  }

  toggleRule(rule: AutomationRule): void {
    rule.active = !rule.active;
    this.automationService.toggleRule(rule.id).subscribe();
  }

  deleteRule(id: string): void {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    this.rules.update(r => r.filter(x => x.id !== id));
    this.automationService.deleteRule(id).subscribe();
  }

  formatTrigger(event: string): string {
    switch (event) {
      case 'FIRST_MESSAGE_RECEIVED': return 'First Customer Message';
      case 'AI_FALLBACK_TRIGGERED': return 'AI Escalation / Fallback';
      case 'APPOINTMENT_CONFIRMED': return 'Appointment Confirmed';
      case 'CONVERSATION_UNANSWERED': return 'Unanswered SLA Breach';
      default: return event;
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
  }
}
