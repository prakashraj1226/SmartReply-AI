import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutomationService, AutomationRule, AutomationExecution, CreateAutomationRuleRequest } from '../../core/services/automation.service';

@Component({
  selector: 'app-automations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="automations-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>Automation Rules Engine</h2>
          <p class="subtitle">Automate greetings, notifications, escalation triggers, and follow-ups</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openCreateModal()">
            + Create Automation Rule
          </button>
        </div>
      </div>

      <!-- ALERTS -->
      <div *ngIf="alertMsg" class="alert" [ngClass]="alertType">
        <span>{{ alertMsg }}</span>
        <button class="alert-close" (click)="alertMsg = ''">✕</button>
      </div>

      <!-- TABS -->
      <div class="tabs-bar">
        <button [class.active]="activeTab() === 'RULES'" (click)="activeTab.set('RULES')">
          Active Workflow Rules ({{ rules().length }})
        </button>
        <button [class.active]="activeTab() === 'EXECUTIONS'" (click)="activeTab.set('EXECUTIONS'); loadExecutions()">
          Execution Logs & History
        </button>
      </div>

      <!-- TAB 1: RULES LIST -->
      <div *ngIf="activeTab() === 'RULES'" class="rules-view">
        <div *ngIf="isLoadingRules()" class="loading-state">
          <div class="spinner"></div>
          <p>Loading automation rules...</p>
        </div>

        <div *ngIf="!isLoadingRules() && rules().length === 0" class="card empty-state">
          <div class="empty-icon">⚙️</div>
          <h3>No automation rules defined yet</h3>
          <p>Create automation rules to auto-greet new customers or alert your staff on escalations.</p>
          <button class="btn btn-primary mt-3" (click)="openCreateModal()">+ Create First Rule</button>
        </div>

        <div *ngIf="!isLoadingRules() && rules().length > 0" class="rules-grid">
          <div *ngFor="let rule of rules()" class="card rule-card">
            <div class="rule-card-header">
              <div>
                <span class="trigger-badge">{{ formatTrigger(rule.triggerEvent) }}</span>
                <h4>{{ rule.name }}</h4>
              </div>
              <label class="switch">
                <input type="checkbox" [checked]="rule.active" (change)="toggleRule(rule)" />
                <span class="slider round"></span>
              </label>
            </div>

            <div class="rule-card-body">
              <div class="action-summary">
                <span class="summary-label">Actions configured:</span>
                <code>{{ rule.actionsJson }}</code>
              </div>
            </div>

            <div class="rule-card-footer">
              <span class="created-at">Created {{ formatDate(rule.createdAt) }}</span>
              <button class="btn btn-sm btn-outline text-danger" (click)="deleteRule(rule.id)">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: EXECUTION LOGS -->
      <div *ngIf="activeTab() === 'EXECUTIONS'" class="card executions-card">
        <div *ngIf="isLoadingExecutions()" class="loading-state">
          <div class="spinner"></div>
          <p>Loading execution history...</p>
        </div>

        <div *ngIf="!isLoadingExecutions() && executions().length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>No executions logged yet. Execution events will appear here when triggers fire.</p>
        </div>

        <div *ngIf="!isLoadingExecutions() && executions().length > 0" class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Trigger Event</th>
                <th>Status</th>
                <th>Executed At</th>
                <th>Details / Error</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let exec of executions()">
                <td><strong>{{ exec.ruleName || 'Automated Action' }}</strong></td>
                <td><span class="trigger-badge">{{ exec.triggerEvent }}</span></td>
                <td>
                  <span class="status-badge" [attr.data-status]="exec.status">{{ exec.status }}</span>
                </td>
                <td>{{ formatDate(exec.executedAt) }}</td>
                <td class="text-muted">{{ exec.errorMessage || 'Completed cleanly with no errors' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- CREATE RULE MODAL -->
    <div *ngIf="showCreateModal" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>⚡ Create Automation Rule</h3>
          <button class="close-btn" (click)="closeCreateModal()">✕</button>
        </div>
        <form (ngSubmit)="submitRule()">
          <div class="modal-body">
            <div class="form-group">
              <label>Rule Name *</label>
              <input
                type="text"
                class="form-control"
                placeholder="e.g. Notify Staff on AI Fallback"
                [(ngModel)]="ruleData.name"
                name="name"
                required
              />
            </div>

            <div class="form-group">
              <label>Trigger Event *</label>
              <select [(ngModel)]="ruleData.triggerEvent" name="triggerEvent" class="form-control">
                <option value="FIRST_MESSAGE_RECEIVED">When a customer sends their first message</option>
                <option value="AI_FALLBACK_TRIGGERED">When AI Assistant escalates to human staff</option>
                <option value="APPOINTMENT_CONFIRMED">When an appointment is confirmed</option>
                <option value="CONVERSATION_UNANSWERED">When a conversation remains unanswered</option>
              </select>
            </div>

            <div class="form-group">
              <label>Action to Execute *</label>
              <select [(ngModel)]="selectedActionType" name="actionType" class="form-control">
                <option value="NOTIFY_USER">Create In-App Staff Notification</option>
                <option value="SEND_REPLY">Send Automated Instant Reply</option>
              </select>
            </div>

            <div *ngIf="selectedActionType === 'NOTIFY_USER'" class="action-config-box">
              <div class="form-group">
                <label>Notification Title</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="notifyTitle"
                  name="notifyTitle"
                  placeholder="Attention: Human Handoff Requested"
                />
              </div>
              <div class="form-group">
                <label>Notification Message</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="notifyMessage"
                  name="notifyMessage"
                  placeholder="A customer enquiry requires assistance from an agent."
                />
              </div>
            </div>

            <div *ngIf="selectedActionType === 'SEND_REPLY'" class="action-config-box">
              <div class="form-group">
                <label>Auto-Reply Text</label>
                <textarea
                  class="form-control"
                  rows="2"
                  [(ngModel)]="replyText"
                  name="replyText"
                  placeholder="Thank you for reaching out! A specialist will assist you momentarily."
                ></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="closeCreateModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="isSubmitting() || !ruleData.name.trim()">
              <span *ngIf="!isSubmitting()">Create Rule</span>
              <span *ngIf="isSubmitting()" class="spinner-sm"></span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .automations-container {
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

    .tabs-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      border-bottom: 1px solid #e2e8f0;
    }

    .tabs-bar button {
      padding: 10px 18px;
      font-size: 0.9rem;
      font-weight: 600;
      border: none;
      background: none;
      color: #64748b;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tabs-bar button.active {
      color: var(--color-primary, #2563eb);
      border-bottom-color: var(--color-primary, #2563eb);
    }

    .rules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
    }

    .card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid var(--color-border, #e2e8f0);
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .rule-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .rule-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }

    .rule-card-header h4 {
      margin: 6px 0 0 0;
      font-size: 1.05rem;
      color: #0f172a;
    }

    .trigger-badge {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      background: #f1f5f9;
      color: #475569;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }

    .action-summary {
      background: #f8fafc;
      padding: 10px 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 0.8rem;
    }

    .summary-label {
      display: block;
      color: #64748b;
      font-size: 0.72rem;
      margin-bottom: 4px;
    }

    .action-summary code {
      color: #0f172a;
      word-break: break-all;
    }

    .rule-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }

    .created-at {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .text-danger { color: #dc2626 !important; border-color: #fca5a5 !important; }
    .text-danger:hover { background: #fef2f2 !important; }

    /* SWITCH */
    .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
    input:checked + .slider { background-color: var(--color-primary, #2563eb); }
    input:checked + .slider:before { transform: translateX(20px); }

    /* TABLE */
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .data-table th { padding: 12px 16px; background: #f8fafc; color: #475569; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }

    .status-badge { font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
    .status-badge[data-status="SUCCESS"] { background: #dcfce7; color: #166534; }
    .status-badge[data-status="FAILED"] { background: #fee2e2; color: #991b1b; }

    /* MODAL */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-dialog { background: #ffffff; border-radius: 12px; width: 90%; max-width: 520px; overflow: hidden; }
    .modal-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 1.15rem; }
    .close-btn { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #94a3b8; }
    .modal-body { padding: 20px; }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; }
    .form-control { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; }
    .action-config-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 10px; }
    .modal-footer { padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; }

    .empty-state { text-align: center; padding: 48px; }
    .empty-icon { font-size: 3rem; margin-bottom: 12px; }

    .spinner {
      width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: var(--color-primary, #2563eb);
      border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 8px;
    }
    .spinner-sm {
      display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
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
  replyText = 'Welcome! Thanks for messaging us. How can we assist you today?';

  constructor(private automationService: AutomationService) {}

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.isLoadingRules.set(true);
    this.automationService.getRules().subscribe({
      next: (res) => {
        this.rules.set(res.data || []);
        this.isLoadingRules.set(false);
      },
      error: () => this.isLoadingRules.set(false)
    });
  }

  loadExecutions(): void {
    this.isLoadingExecutions.set(true);
    this.automationService.getExecutions(0, 50).subscribe({
      next: (res) => {
        this.executions.set(res.data?.content || []);
        this.isLoadingExecutions.set(false);
      },
      error: () => this.isLoadingExecutions.set(false)
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
      error: () => this.isSubmitting.set(false)
    });
  }

  toggleRule(rule: AutomationRule): void {
    this.automationService.toggleRule(rule.id).subscribe({
      next: (res) => {
        rule.active = res.data.active;
      }
    });
  }

  deleteRule(id: string): void {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    this.automationService.deleteRule(id).subscribe({
      next: () => {
        this.alertType = 'success';
        this.alertMsg = 'Rule deleted successfully.';
        this.loadRules();
      }
    });
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
    return new Date(dateStr).toLocaleString();
  }
}
