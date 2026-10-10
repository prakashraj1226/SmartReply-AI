import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, BusinessProfile, AiConfig, TeamMember, InviteMemberRequest } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <!-- Header -->
      <header class="page-header">
        <div>
          <h1 class="page-title">Settings & Configuration</h1>
          <p class="page-subtitle">
            Configure your business profile, fine-tune the AI customer assistant persona, and manage team access.
          </p>
        </div>
      </header>

      <!-- Toast / Alert -->
      @if (alertMessage()) {
        <div class="alert-banner" [ngClass]="alertType()">
          <span>{{ alertMessage() }}</span>
          <button class="close-alert-btn" (click)="alertMessage.set(null)">✕</button>
        </div>
      }

      <!-- Tab Navigation -->
      <div class="tabs-nav">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'profile'"
          (click)="activeTab.set('profile')">
          🏢 Business Profile
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'ai'"
          (click)="activeTab.set('ai')">
          🤖 AI Assistant Behavior
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'team'"
          (click)="activeTab.set('team')">
          👥 Team & Agents ({{ teamMembers().length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'security'"
          (click)="activeTab.set('security')">
          🔒 Security & Policies
        </button>
      </div>

      <!-- Tab 1: Business Profile -->
      @if (activeTab() === 'profile') {
        <div class="card settings-card">
          <div class="card-header">
            <h2 class="card-title">Business Profile Information</h2>
            <p class="card-desc">Used for customer communication headers, appointments, and receipts.</p>
          </div>

          <form (ngSubmit)="saveProfile()" class="form-grid">
            <div class="form-group col-span-2">
              <label class="form-label">Business Name *</label>
              <input type="text" [(ngModel)]="profile.name" name="name" required class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label">Business Category</label>
              <select [(ngModel)]="profile.category" name="category" class="form-control">
                <option value="Healthcare & Dental">Healthcare & Dental</option>
                <option value="Salon & Spa">Salon & Spa</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Educational Institution">Educational Institution</option>
                <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                <option value="Consulting & Professional Services">Consulting & Professional Services</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Support Email</label>
              <input type="email" [(ngModel)]="profile.email" name="email" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label">Customer Contact Phone</label>
              <input type="text" [(ngModel)]="profile.phone" name="phone" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label">Timezone</label>
              <select [(ngModel)]="profile.timezone" name="timezone" class="form-control">
                <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
              </select>
            </div>

            <div class="form-group col-span-2">
              <label class="form-label">Operating Hours</label>
              <input type="text" [(ngModel)]="profile.operatingHoursJson" name="operatingHoursJson"
                     placeholder="e.g. Mon-Sat: 09:00 - 19:00, Sun: Closed" class="form-control" />
            </div>

            <div class="form-group col-span-2">
              <label class="form-label">Physical Address</label>
              <textarea [(ngModel)]="profile.address" name="address" rows="2" class="form-control"></textarea>
            </div>

            <div class="form-group col-span-2">
              <label class="form-label">Public Business Description</label>
              <textarea [(ngModel)]="profile.description" name="description" rows="3"
                        placeholder="Provide details about your specialties and offerings used by the AI assistant." class="form-control"></textarea>
            </div>

            <div class="form-actions col-span-2">
              <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
                {{ isSaving() ? 'Saving Changes...' : 'Save Business Profile' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Tab 2: AI Assistant Behavior -->
      @if (activeTab() === 'ai') {
        <div class="card settings-card">
          <div class="card-header">
            <h2 class="card-title">AI Assistant Persona & Guardrails</h2>
            <p class="card-desc">Control automated responses, conversational tone, and human handoff thresholds.</p>
          </div>

          <form (ngSubmit)="saveAiConfig()" class="form-grid">
            <div class="form-group col-span-2">
              <div class="toggle-container">
                <div>
                  <strong>Enable Automated AI Assistant</strong>
                  <p class="text-muted">When active, verified inquiries will receive immediate AI responses from your knowledge base.</p>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="aiConfig.enabled" name="enabled" />
                  <span class="slider round"></span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Assistant Display Name</label>
              <input type="text" [(ngModel)]="aiConfig.assistantName" name="assistantName" required class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label">Conversational Tone</label>
              <select [(ngModel)]="aiConfig.tone" name="tone" class="form-control">
                <option value="PROFESSIONAL">Professional & Courteous</option>
                <option value="FRIENDLY">Friendly & Warm</option>
                <option value="EMPATHETIC">Empathetic & Caring</option>
                <option value="CONCISE">Concise & Direct</option>
              </select>
            </div>

            <div class="form-group col-span-2">
              <label class="form-label">Initial Welcome / Greeting Message</label>
              <textarea [(ngModel)]="aiConfig.greetingMessage" name="greetingMessage" rows="2" class="form-control"></textarea>
            </div>

            <div class="form-group col-span-2">
              <label class="form-label">Clarification & Human Handoff Message</label>
              <textarea [(ngModel)]="aiConfig.fallbackMessage" name="fallbackMessage" rows="2" class="form-control"></textarea>
              <span class="form-help">Triggered when confidence score falls below the threshold or when no knowledge matches.</span>
            </div>

            <div class="form-group">
              <label class="form-label">Confidence Threshold: {{ (aiConfig.confidenceThreshold * 100) | number:'1.0-0' }}%</label>
              <input type="range" min="0.10" max="1.00" step="0.05" [(ngModel)]="aiConfig.confidenceThreshold" name="confidenceThreshold" class="range-slider" />
              <span class="form-help">Higher values ensure conservative answers with faster human escalation.</span>
            </div>

            <div class="form-group">
              <label class="form-label">Max Response Length (Tokens)</label>
              <input type="number" min="50" max="1000" [(ngModel)]="aiConfig.maxResponseTokens" name="maxResponseTokens" class="form-control" />
            </div>

            <div class="form-actions col-span-2">
              <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
                {{ isSaving() ? 'Saving Configuration...' : 'Save AI Configuration' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Tab 3: Team & Permissions -->
      @if (activeTab() === 'team') {
        <div class="card settings-card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Business Team & Support Agents</h2>
              <p class="card-desc">Assign team members to manage customer conversations and appointments.</p>
            </div>
            <button class="btn btn-primary" (click)="showInviteModal.set(true)">
              + Invite Team Member
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (member of teamMembers(); track member.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar">{{ member.fullName.charAt(0) }}</div>
                        <strong>{{ member.fullName }}</strong>
                      </div>
                    </td>
                    <td>{{ member.email }}</td>
                    <td>
                      <span class="role-badge" [class.role-owner]="member.role === 'OWNER'">
                        {{ member.role }}
                      </span>
                    </td>
                    <td>{{ member.joinedAt | date:'mediumDate' }}</td>
                    <td>
                      @if (member.role !== 'OWNER') {
                        <button class="btn-remove" (click)="removeMember(member)">Remove</button>
                      } @else {
                        <span class="text-muted">Primary Owner</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Tab 4: Security & Policies -->
      @if (activeTab() === 'security') {
        <div class="card settings-card">
          <div class="card-header">
            <h2 class="card-title">Security & Enterprise Governance</h2>
            <p class="card-desc">Architecture policies protecting your tenant data and customer communication.</p>
          </div>

          <div class="policy-list">
            <div class="policy-card">
              <div class="policy-icon">🛡️</div>
              <div>
                <h4>Multi-Tenant Cryptographic Isolation</h4>
                <p>Every SQL query, message event, and webhook execution is strictly bound to your business identifier via Hibernate TenantContext.</p>
              </div>
            </div>

            <div class="policy-card">
              <div class="policy-icon">🔑</div>
              <div>
                <h4>Stateless JWT & BCrypt Password Hashing</h4>
                <p>All sessions use tamper-proof HMAC-SHA256 tokens with configurable expiration and salt-hashed passwords.</p>
              </div>
            </div>

            <div class="policy-card">
              <div class="policy-icon">📜</div>
              <div>
                <h4>Audit Trail Logging</h4>
                <p>All administrative updates, team invites, and status modifications are recorded permanently in the PostgreSQL audit log.</p>
              </div>
            </div>

            <div class="policy-card">
              <div class="policy-icon">⚡</div>
              <div>
                <h4>WhatsApp Official Cloud API Webhook Idempotency</h4>
                <p>Inbound WhatsApp payloads are verified using SHA-256 HMAC and deduplicated via unique event IDs to prevent duplicate responses.</p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Invite Team Member Modal -->
      @if (showInviteModal()) {
        <div class="modal-overlay">
          <div class="modal-card">
            <div class="modal-header">
              <h3 class="modal-title">Invite Team Member</h3>
              <button class="modal-close" (click)="showInviteModal.set(false)">✕</button>
            </div>

            <form (ngSubmit)="inviteMember()" class="modal-body">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input type="text" [(ngModel)]="newMember.fullName" name="fullName" required class="form-control" />
              </div>

              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input type="email" [(ngModel)]="newMember.email" name="email" required class="form-control" />
              </div>

              <div class="form-group">
                <label class="form-label">Role</label>
                <select [(ngModel)]="newMember.role" name="role" class="form-control">
                  <option value="AGENT">Support Agent</option>
                  <option value="ADMIN">Business Admin</option>
                </select>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showInviteModal.set(false)">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="isInviting()">
                  {{ isInviting() ? 'Sending Invitation...' : 'Add Team Member' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1.5rem;
      font-family: inherit;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .page-subtitle {
      color: #64748b;
      margin-top: 0.35rem;
      font-size: 0.95rem;
    }

    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 0.75rem 1.25rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: #1e293b;
    }

    .tab-btn.active {
      color: #2563eb;
      border-bottom-color: #2563eb;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .card-header {
      margin-bottom: 1.5rem;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .card-desc {
      color: #64748b;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }

    .flex-between {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    .col-span-2 {
      grid-column: span 2;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
    }

    .form-control {
      padding: 0.6rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #0f172a;
      background: #ffffff;
    }

    .form-control:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .form-help {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .range-slider {
      width: 100%;
      accent-color: #2563eb;
    }

    .toggle-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 1rem;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #cbd5e1;
      transition: .3s;
      border-radius: 24px;
    }

    .slider:before {
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

    input:checked + .slider {
      background-color: #2563eb;
    }

    input:checked + .slider:before {
      transform: translateX(20px);
    }

    .btn {
      padding: 0.65rem 1.25rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      font-size: 0.9rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-remove {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
    }

    .btn-remove:hover {
      background: #fecaca;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    .data-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      color: #475569;
      font-weight: 600;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 0.9rem 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }

    .role-badge {
      background: #f1f5f9;
      color: #475569;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .role-owner {
      background: #e0e7ff;
      color: #4338ca;
    }

    .policy-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .policy-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
    }

    .policy-icon {
      font-size: 1.75rem;
    }

    .policy-card h4 {
      margin: 0 0 0.35rem 0;
      font-size: 1rem;
      color: #0f172a;
    }

    .policy-card p {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
      line-height: 1.4;
    }

    .alert-banner {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .alert-banner.success {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .alert-banner.error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .close-alert-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      color: inherit;
    }

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 12px;
      width: 100%;
      max-width: 450px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.25rem;
      color: #64748b;
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }
  `]
})
export class SettingsComponent implements OnInit {
  activeTab = signal<'profile' | 'ai' | 'team' | 'security'>('profile');
  isSaving = signal<boolean>(false);
  isInviting = signal<boolean>(false);
  showInviteModal = signal<boolean>(false);

  alertMessage = signal<string | null>(null);
  alertType = signal<'success' | 'error'>('success');

  profile: BusinessProfile = {
    id: '',
    name: '',
    category: '',
    email: '',
    phone: '',
    address: '',
    timezone: 'Asia/Kolkata',
    operatingHoursJson: '',
    preferredLanguage: 'en',
    description: ''
  };

  aiConfig: AiConfig = {
    assistantName: 'SmartReply Assistant',
    tone: 'PROFESSIONAL',
    greetingMessage: 'Hello! How can I help you today?',
    fallbackMessage: 'Let me connect you with our human team member.',
    confidenceThreshold: 0.70,
    enabled: true,
    maxResponseTokens: 250
  };

  teamMembers = signal<TeamMember[]>([]);

  newMember: InviteMemberRequest = {
    email: '',
    fullName: '',
    role: 'AGENT'
  };

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.loadAllSettings();
  }

  loadAllSettings(): void {
    this.settingsService.getProfile().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.profile = { ...res.data };
        }
      }
    });

    this.settingsService.getAiConfig().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.aiConfig = { ...res.data };
        }
      }
    });

    this.loadTeamMembers();
  }

  loadTeamMembers(): void {
    this.settingsService.getTeamMembers().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.teamMembers.set(res.data);
        }
      }
    });
  }

  saveProfile(): void {
    this.isSaving.set(true);
    this.settingsService.updateProfile(this.profile).subscribe({
      next: res => {
        this.isSaving.set(false);
        if (res.success) {
          this.alertType.set('success');
          this.alertMessage.set('Business profile saved successfully.');
        }
      },
      error: err => {
        this.isSaving.set(false);
        this.alertType.set('error');
        this.alertMessage.set(err.error?.message || 'Failed to save business profile.');
      }
    });
  }

  saveAiConfig(): void {
    this.isSaving.set(true);
    this.settingsService.updateAiConfig(this.aiConfig).subscribe({
      next: res => {
        this.isSaving.set(false);
        if (res.success) {
          this.alertType.set('success');
          this.alertMessage.set('AI assistant configuration saved successfully.');
        }
      },
      error: err => {
        this.isSaving.set(false);
        this.alertType.set('error');
        this.alertMessage.set(err.error?.message || 'Failed to update AI configuration.');
      }
    });
  }

  inviteMember(): void {
    this.isInviting.set(true);
    this.settingsService.inviteTeamMember(this.newMember).subscribe({
      next: res => {
        this.isInviting.set(false);
        this.showInviteModal.set(false);
        this.newMember = { email: '', fullName: '', role: 'AGENT' };
        this.alertType.set('success');
        this.alertMessage.set('Team member invited successfully.');
        this.loadTeamMembers();
      },
      error: err => {
        this.isInviting.set(false);
        this.alertType.set('error');
        this.alertMessage.set(err.error?.message || 'Failed to invite team member.');
      }
    });
  }

  removeMember(member: TeamMember): void {
    if (!confirm(`Are you sure you want to remove ${member.fullName} (${member.email}) from your team?`)) {
      return;
    }

    this.settingsService.removeTeamMember(member.id).subscribe({
      next: res => {
        if (res.success) {
          this.alertType.set('success');
          this.alertMessage.set('Team member removed.');
          this.loadTeamMembers();
        }
      },
      error: err => {
        this.alertType.set('error');
        this.alertMessage.set(err.error?.message || 'Failed to remove team member.');
      }
    });
  }
}
