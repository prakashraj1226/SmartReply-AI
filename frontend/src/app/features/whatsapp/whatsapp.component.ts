import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhatsAppService, WhatsAppConfig, UpdateWhatsAppConfigRequest, WhatsAppSendResult } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-whatsapp-integration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="whatsapp-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>WhatsApp Business Integration</h2>
          <p class="subtitle">Connect your official Meta WhatsApp Business Cloud API or use Sandbox Simulator</p>
        </div>
        <div class="header-badges">
          <span class="status-badge" [attr.data-status]="config()?.status || 'SANDBOX'">
            ● {{ config()?.status || 'SANDBOX' }}
          </span>
          <span *ngIf="config()?.sandbox" class="sandbox-badge">
            🧪 Sandbox Mode
          </span>
        </div>
      </div>

      <!-- SUCCESS / ERROR ALERTS -->
      <div *ngIf="alertMessage" class="alert" [ngClass]="alertType">
        <span>{{ alertMessage }}</span>
        <button class="alert-close" (click)="alertMessage = ''">✕</button>
      </div>

      <div class="grid-layout">
        <!-- LEFT: CREDENTIALS & WEBHOOK CONFIGURATION -->
        <div class="card config-card">
          <div class="card-header">
            <h3>⚙️ Meta Cloud API Credentials</h3>
            <p>Enter credentials from your Meta for Developers dashboard.</p>
          </div>

          <form (ngSubmit)="saveConfig()">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Phone Number ID *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. 109827364512345"
                  [(ngModel)]="formData.phoneNumberId"
                  name="phoneNumberId"
                />
                <span class="hint">Found in Meta App > WhatsApp > API Setup</span>
              </div>
              <div class="form-group flex-1">
                <label>WABA Account ID</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. 102938475610293"
                  [(ngModel)]="formData.accountId"
                  name="accountId"
                />
              </div>
            </div>

            <div class="form-group">
              <label>WhatsApp Display Phone Number</label>
              <input
                type="text"
                class="form-control"
                placeholder="e.g. +91 98765 43210"
                [(ngModel)]="formData.phoneNumber"
                name="phoneNumber"
              />
            </div>

            <div class="form-group">
              <label>Permanent System User Access Token</label>
              <div class="input-with-button">
                <input
                  [type]="showToken ? 'text' : 'password'"
                  class="form-control"
                  placeholder="EAAG..."
                  [(ngModel)]="formData.accessToken"
                  name="accessToken"
                />
                <button type="button" class="btn btn-outline btn-sm" (click)="showToken = !showToken">
                  {{ showToken ? 'Hide' : 'Show' }}
                </button>
              </div>
              <span class="hint">Generate from Meta Business Manager > System Users</span>
            </div>

            <div class="form-group">
              <label>Meta App Secret (for HMAC Webhook Validation)</label>
              <input
                type="password"
                class="form-control"
                placeholder="From App Dashboard > App Settings > Basic"
                [(ngModel)]="formData.appSecret"
                name="appSecret"
              />
            </div>

            <!-- WEBHOOK PARAMS -->
            <div class="webhook-section">
              <h4>Meta Webhook Configuration</h4>
              <p class="section-desc">Paste these values into Meta App Dashboard > WhatsApp > Configuration > Webhook</p>

              <div class="form-group">
                <label>Callback URL</label>
                <div class="input-with-button">
                  <input
                    type="text"
                    class="form-control code-input"
                    [value]="config()?.webhookCallbackUrl || ''"
                    readonly
                  />
                  <button type="button" class="btn btn-outline btn-sm" (click)="copyToClipboard(config()?.webhookCallbackUrl || '')">
                    {{ copiedUrl ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Verify Token</label>
                <div class="input-with-button">
                  <input
                    type="text"
                    class="form-control code-input"
                    [(ngModel)]="formData.webhookVerifyToken"
                    name="webhookVerifyToken"
                  />
                  <button type="button" class="btn btn-outline btn-sm" (click)="copyToClipboard(formData.webhookVerifyToken || '')">
                    {{ copiedToken ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
              </div>
            </div>

            <div class="form-group toggle-row">
              <div>
                <label class="toggle-title">Sandbox Simulator Mode</label>
                <p class="toggle-desc">Enable to simulate WhatsApp message delivery without needing real Meta credentials.</p>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  [(ngModel)]="formData.isSandbox"
                  name="isSandbox"
                />
                <span class="slider round"></span>
              </label>
            </div>

            <div class="card-footer-actions">
              <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
                <span *ngIf="!isSaving()">Save & Verify Connection</span>
                <span *ngIf="isSaving()" class="spinner-sm"></span>
              </button>
            </div>
          </form>
        </div>

        <!-- RIGHT: LIVE TESTING & SIMULATOR -->
        <div class="testing-column">
          <!-- CARD 1: TEST OUTBOUND MESSAGE -->
          <div class="card test-card">
            <div class="card-header">
              <h3>📤 Test Outbound Message</h3>
              <p>Dispatch a test WhatsApp message to verify outbound delivery.</p>
            </div>

            <div class="form-group">
              <label>Recipient WhatsApp Number</label>
              <input
                type="text"
                class="form-control"
                placeholder="+919876543210"
                [(ngModel)]="testRecipientPhone"
              />
            </div>

            <div class="form-group">
              <label>Message Content</label>
              <textarea
                class="form-control"
                rows="2"
                [(ngModel)]="testMessageText"
                placeholder="Test message from SmartReply AI"
              ></textarea>
            </div>

            <button
              class="btn btn-secondary btn-block"
              [disabled]="isTestingSend() || !testRecipientPhone.trim() || !testMessageText.trim()"
              (click)="sendTestMessage()"
            >
              <span *ngIf="!isTestingSend()">Send Test Message</span>
              <span *ngIf="isTestingSend()" class="spinner-sm"></span>
            </button>

            <!-- Test Result Banner -->
            <div *ngIf="testResult" class="test-result-box" [class.success]="testResult.success" [class.error]="!testResult.success">
              <div class="result-header">
                <strong>{{ testResult.success ? '✓ Message Dispatched' : '✗ Dispatch Failed' }}</strong>
                <span class="sim-pill" *ngIf="testResult.simulated">Simulated Sandbox</span>
              </div>
              <p *ngIf="testResult.messageId">Message ID: <code>{{ testResult.messageId }}</code></p>
              <p *ngIf="testResult.errorMessage" class="error-text">{{ testResult.errorMessage }}</p>
            </div>
          </div>

          <!-- CARD 2: SIMULATE INCOMING META WEBHOOK -->
          <div class="card simulator-card">
            <div class="card-header">
              <h3>⚡ Simulate Incoming Webhook</h3>
              <p>Test how SmartReply AI processes real Meta Webhook payloads.</p>
            </div>

            <div class="form-group">
              <label>Sender Customer Phone</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="simPhone"
                placeholder="+919876500111"
              />
            </div>

            <div class="form-group">
              <label>Sender Name</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="simName"
                placeholder="Meera Joshi"
              />
            </div>

            <div class="form-group">
              <label>Inbound Message Text</label>
              <textarea
                class="form-control"
                rows="2"
                [(ngModel)]="simText"
                placeholder="e.g. Do you offer teeth whitening?"
              ></textarea>
            </div>

            <button
              class="btn btn-outline btn-block"
              [disabled]="isSimulatingHook() || !simText.trim()"
              (click)="simulateInboundWebhook()"
            >
              <span *ngIf="!isSimulatingHook()">Trigger Webhook Inbound</span>
              <span *ngIf="isSimulatingHook()" class="spinner-sm"></span>
            </button>

            <div *ngIf="webhookResultMsg" class="test-result-box success mt-2">
              <strong>✓ Webhook Processed!</strong>
              <p>{{ webhookResultMsg }}</p>
              <a href="/inbox" class="inbox-link">View conversation in Inbox ➔</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .whatsapp-container {
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
      color: var(--color-text, #0f172a);
    }

    .subtitle {
      color: #64748b;
      font-size: 0.9rem;
      margin: 0;
    }

    .header-badges {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .status-badge {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }

    .status-badge[data-status="CONNECTED"] {
      background: #dcfce7;
      color: #166534;
    }

    .status-badge[data-status="SANDBOX"] {
      background: #fef9c3;
      color: #854d0e;
    }

    .status-badge[data-status="ERROR"] {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-badge[data-status="DISCONNECTED"] {
      background: #e2e8f0;
      color: #475569;
    }

    .sandbox-badge {
      background: #f3e8ff;
      color: #7e22ce;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
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

    .alert.success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .alert.error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .alert-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      color: inherit;
    }

    .grid-layout {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 24px;
    }

    @media (max-width: 900px) {
      .grid-layout {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid var(--color-border, #e2e8f0);
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .card-header {
      margin-bottom: 20px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 12px;
    }

    .card-header h3 {
      margin: 0 0 4px 0;
      font-size: 1.15rem;
      color: #0f172a;
    }

    .card-header p {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .flex-1 { flex: 1; }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }

    .form-control {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      box-sizing: border-box;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--color-primary, #2563eb);
    }

    .code-input {
      font-family: monospace;
      font-size: 0.8rem;
      background: #f8fafc;
    }

    .hint {
      display: block;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 4px;
    }

    .input-with-button {
      display: flex;
      gap: 8px;
    }

    .webhook-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }

    .webhook-section h4 {
      margin: 0 0 4px 0;
      font-size: 0.95rem;
      color: #1e293b;
    }

    .section-desc {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0 0 14px 0;
    }

    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-top: 1px solid #f1f5f9;
    }

    .toggle-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .toggle-desc {
      font-size: 0.8rem;
      color: #64748b;
      margin: 2px 0 0 0;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 26px;
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
      border-radius: 26px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: var(--color-primary, #2563eb);
    }

    input:checked + .slider:before {
      transform: translateX(22px);
    }

    .card-footer-actions {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }

    .testing-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .btn-block {
      width: 100%;
    }

    .test-result-box {
      margin-top: 14px;
      padding: 12px;
      border-radius: 8px;
      font-size: 0.85rem;
    }

    .test-result-box.success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }

    .test-result-box.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .sim-pill {
      background: #e0e7ff;
      color: #3730a3;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .inbox-link {
      display: inline-block;
      margin-top: 6px;
      color: var(--color-primary, #2563eb);
      font-weight: 600;
      text-decoration: none;
    }

    .spinner-sm {
      display: inline-block;
      width: 16px;
      height: 16px;
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
export class WhatsAppIntegrationComponent implements OnInit {
  config = signal<WhatsAppConfig | null>(null);

  formData: UpdateWhatsAppConfigRequest = {
    accountId: '',
    phoneNumberId: '',
    phoneNumber: '',
    accessToken: '',
    webhookVerifyToken: '',
    appSecret: '',
    isSandbox: true
  };

  testRecipientPhone = '+919876500111';
  testMessageText = 'Hello! This is a test verification message from SmartReply AI.';
  testResult: WhatsAppSendResult | null = null;

  simPhone = '+919876500111';
  simName = 'Meera Joshi';
  simText = 'What are your clinic operating hours?';
  webhookResultMsg = '';

  isSaving = signal(false);
  isTestingSend = signal(false);
  isSimulatingHook = signal(false);

  showToken = false;
  copiedUrl = false;
  copiedToken = false;
  alertMessage = '';
  alertType = 'success';

  constructor(private whatsAppService: WhatsAppService) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.whatsAppService.getConfig().subscribe({
      next: (res) => {
        const c = res.data;
        this.config.set(c);
        this.formData = {
          accountId: c.accountId || '',
          phoneNumberId: c.phoneNumberId || '',
          phoneNumber: c.phoneNumber || '',
          accessToken: '',
          webhookVerifyToken: c.webhookVerifyToken || '',
          appSecret: '',
          isSandbox: c.sandbox
        };
      }
    });
  }

  saveConfig(): void {
    this.isSaving.set(true);
    this.whatsAppService.updateConfig(this.formData).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.config.set(res.data);
        this.alertType = 'success';
        this.alertMessage = 'WhatsApp configuration saved and verified successfully!';
      },
      error: (err) => {
        this.isSaving.set(false);
        this.alertType = 'error';
        this.alertMessage = err?.error?.message || 'Failed to update WhatsApp configuration.';
      }
    });
  }

  sendTestMessage(): void {
    this.isTestingSend.set(true);
    this.testResult = null;
    this.whatsAppService.testSend(this.testRecipientPhone, this.testMessageText).subscribe({
      next: (res) => {
        this.isTestingSend.set(false);
        this.testResult = res.data;
      },
      error: (err) => {
        this.isTestingSend.set(false);
        this.testResult = {
          success: false,
          status: 'FAILED',
          errorMessage: err?.error?.message || 'Error executing test send',
          simulated: false
        };
      }
    });
  }

  simulateInboundWebhook(): void {
    this.isSimulatingHook.set(true);
    this.webhookResultMsg = '';
    this.whatsAppService.simulateWebhook(this.simPhone, this.simText, this.simName).subscribe({
      next: (res) => {
        this.isSimulatingHook.set(false);
        this.webhookResultMsg = `Dispatched message event ID: ${res.data}. The AI assistant evaluated the message and updated the conversation inbox!`;
      },
      error: () => this.isSimulatingHook.set(false)
    });
  }

  copyToClipboard(text: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (text === this.config()?.webhookCallbackUrl) {
      this.copiedUrl = true;
      setTimeout(() => this.copiedUrl = false, 2000);
    } else {
      this.copiedToken = true;
      setTimeout(() => this.copiedToken = false, 2000);
    }
  }
}
