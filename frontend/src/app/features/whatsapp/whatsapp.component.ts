import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WhatsAppService, WhatsAppConfig, UpdateWhatsAppConfigRequest, WhatsAppSendResult, AutoReplyResult } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-whatsapp-integration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="whatsapp-page">

      <!-- 1. Glowing Hero Gradient Card (Reference 4 & 5 Style) -->
      <div class="hero-banner-card">
        <div class="hero-banner-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>META CLOUD API & SANDBOX ENVIRONMENT</span>
          </div>
          <h1 class="hero-title">Official WhatsApp Business API</h1>
          <p class="hero-subtitle">
            Connect your official Meta WhatsApp Business Cloud API or verify instant delivery via the local Sandbox Simulator.
          </p>
        </div>
        <div class="hero-actions">
          <div class="gateway-status-pill">
            <span class="gateway-dot"></span>
            <span>{{ config()?.status || 'SANDBOX ACTIVE' }}</span>
          </div>
        </div>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row (Reference 4 Style) -->
      <div class="kpi-grid">
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator blue"></span>
              <span class="kpi-label">GATEWAY STATUS</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ config()?.sandbox ? 'Sandbox' : 'Production' }}</div>
          <div class="kpi-subtext">Meta Cloud API webhook live</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator green"></span>
              <span class="kpi-label">CONNECTED NUMBER</span>
            </div>
            <div class="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-number phone-num-kpi">{{ formData.phoneNumber || 'Not Connected' }}</div>
          <div class="kpi-subtext">Official WhatsApp Account</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator amber"></span>
              <span class="kpi-label">MESSAGES DELIVERED</span>
            </div>
            <div class="kpi-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ config()?.autoReplyCount ?? 0 }}</div>
          <div class="kpi-subtext">Automatic replies for this business</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">AUTOMATIC REPLY</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-number">On</div>
          <div class="kpi-subtext">Uses this business's services and appointments</div>
        </div>
      </div>

      <!-- ALERTS -->
      <div *ngIf="alertMessage" class="alert-banner" [ngClass]="alertType">
        <div class="alert-content">
          <span class="alert-icon">{{ alertType === 'success' ? '✓' : '⚠' }}</span>
          <span>{{ alertMessage }}</span>
        </div>
        <button class="alert-close" (click)="alertMessage = ''">✕</button>
      </div>

      <!-- 3. Side-by-Side Credentials & Testing Grid -->
      <div class="config-grid">

        <!-- LEFT: META CLOUD API CREDENTIALS CARD -->
        <div class="content-card">
          <div class="card-header-flex">
            <div class="title-with-badge">
              <div class="icon-badge blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </div>
              <div>
                <h3 class="card-main-title">Meta Cloud API Credentials</h3>
                <p class="card-sub-title">Configured from Meta Developers App Dashboard</p>
              </div>
            </div>
          </div>

          <form (ngSubmit)="saveConfig()" class="card-body-form">
            <div class="form-row-2">
              <div class="form-group">
                <label>Phone Number ID *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. 109827364512345"
                  [(ngModel)]="formData.phoneNumberId"
                  name="phoneNumberId"
                />
                <span class="form-hint">Found in Meta App > WhatsApp > API Setup</span>
              </div>
              <div class="form-group">
                <label>WABA Account ID</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. 102938475610293"
                  [(ngModel)]="formData.accountId"
                  name="accountId"
                />
                <span class="form-hint">WhatsApp Business Account ID</span>
              </div>
            </div>

            <div class="form-group">
              <label>WhatsApp Display Phone Number</label>
              <input
                type="text"
                class="form-control"
                placeholder="e.g. +91 98401 23456"
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
                <button type="button" class="btn-input-addon" (click)="showToken = !showToken">
                  {{ showToken ? 'Hide' : 'Show' }}
                </button>
              </div>
              <span class="form-hint">Generate from Meta Business Manager > System Users</span>
            </div>

            <div class="form-group">
              <label>Meta App Secret (HMAC-SHA256 Webhook Validation)</label>
              <input
                type="password"
                class="form-control"
                placeholder="App Dashboard > App Settings > Basic"
                [(ngModel)]="formData.appSecret"
                name="appSecret"
              />
            </div>

            <!-- Webhook Box -->
            <div class="webhook-card-inner">
              <div class="webhook-hdr">
                <span class="webhook-tag">WEBHOOK ENDPOINTS</span>
                <p>Paste these exact values into Meta WhatsApp > Configuration > Webhook</p>
              </div>

              <div class="form-group">
                <label>Callback URL</label>
                <div class="input-with-button">
                  <input
                    type="text"
                    class="form-control code-font"
                    [value]="config()?.webhookCallbackUrl || ''"
                    readonly
                  />
                  <button type="button" class="btn-input-addon" (click)="copyToClipboard(config()?.webhookCallbackUrl || '')">
                    {{ copiedUrl ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Verify Token</label>
                <div class="input-with-button">
                  <input
                    type="text"
                    class="form-control code-font"
                    [(ngModel)]="formData.webhookVerifyToken"
                    name="webhookVerifyToken"
                  />
                  <button type="button" class="btn-input-addon" (click)="copyToClipboard(formData.webhookVerifyToken || '')">
                    {{ copiedToken ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Sandbox Mode Switch -->
            <div class="toggle-row-card">
              <div>
                <label class="toggle-label-bold">Sandbox Simulator Mode</label>
                <p class="toggle-desc-sub">Simulates WhatsApp message delivery & AI responses without requiring active Meta credentials.</p>
              </div>
              <label class="switch-ui">
                <input
                  type="checkbox"
                  [(ngModel)]="formData.isSandbox"
                  name="isSandbox"
                />
                <span class="slider-ui"></span>
              </label>
            </div>

            <div class="form-actions-bar">
              <button type="submit" class="btn-save-primary" [disabled]="isSaving()">
                <span *ngIf="!isSaving()">Save & Verify Connection</span>
                <span *ngIf="isSaving()" class="spinner-sm"></span>
              </button>
            </div>
          </form>
        </div>

        <!-- RIGHT: LIVE DISPATCH & SIMULATOR TESTING -->
        <div class="testing-column">

          <!-- TEST 1: DISPATCH OUTBOUND MESSAGE -->
          <div class="content-card">
            <div class="card-header-flex">
              <div class="title-with-badge">
                <div class="icon-badge green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </div>
                <div>
                  <h3 class="card-main-title">Test Outbound Message</h3>
                  <p class="card-sub-title">Verify real-time delivery to a test recipient</p>
                </div>
              </div>
            </div>

            <div class="card-body-form">
              <div class="form-group">
                <label>Recipient WhatsApp Number</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="+91 98401 23456"
                  [(ngModel)]="testRecipientPhone"
                />
              </div>

              <div class="form-group">
                <label>Message Content</label>
                <textarea
                  class="form-control"
                  rows="2"
                  [(ngModel)]="testMessageText"
                  placeholder="Test message from SmartReply AI..."
                ></textarea>
              </div>

              <button
                type="button"
                class="btn-send-test"
                [disabled]="isTestingSend() || !testRecipientPhone.trim() || !testMessageText.trim()"
                (click)="sendTestMessage()"
              >
                <span *ngIf="!isTestingSend()">Dispatch Test Message ➔</span>
                <span *ngIf="isTestingSend()" class="spinner-sm"></span>
              </button>

              <div *ngIf="testResult" class="result-banner" [class.success]="testResult.success" [class.error]="!testResult.success">
                <div class="result-title-row">
                  <strong>{{ testResult.success ? (testResult.simulated ? '✓ In-App Simulated' : '✓ WhatsApp Dispatched') : '✗ Dispatch Failed' }}</strong>
                  <span class="sim-badge" *ngIf="testResult.simulated">Sandbox Simulator Mode</span>
                </div>
                <p *ngIf="testResult.messageId">Message ID: <code>{{ testResult.messageId }}</code></p>
                <div *ngIf="testResult.simulated" class="sim-notice">
                  ℹ️ <strong>Sandbox Mode:</strong> Message was simulated in-app. To receive messages on your physical WhatsApp phone, paste your Meta Access Token and disable Sandbox Mode.
                </div>
                <p *ngIf="testResult.errorMessage" class="error-msg">{{ testResult.errorMessage }}</p>
              </div>
            </div>
          </div>

          <!-- TEST 2: SIMULATE INCOMING WEBHOOK -->
          <div class="content-card">
            <div class="card-header-flex">
              <div class="title-with-badge">
                <div class="icon-badge amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <div>
                  <h3 class="card-main-title">Automatic reply</h3>
                  <p class="card-sub-title">Send a customer message. The bot answers from this business.</p>
                </div>
              </div>
            </div>

            <div class="card-body-form">
              <div class="form-row-2">
                <div class="form-group">
                  <label>Sender Patient Phone</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="simPhone"
                    placeholder="+91 98401 23456"
                  />
                </div>
                <div class="form-group">
                  <label>Patient Name</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="simName"
                    placeholder="Ananya Sharma"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Inbound Question</label>
                <textarea
                  class="form-control"
                  rows="2"
                  [(ngModel)]="simText"
                  placeholder="e.g. What are your opening hours on Saturday?"
                ></textarea>
              </div>

              <button
                type="button"
                class="btn-sim-webhook"
                [disabled]="isSimulatingHook() || !simText.trim()"
                (click)="simulateInboundWebhook()"
              >
                <span *ngIf="!isSimulatingHook()">Get automatic reply</span>
                <span *ngIf="isSimulatingHook()" class="spinner-sm"></span>
              </button>

              <div *ngIf="autoReply" class="webhook-success-box">
                <div>
                  <p><strong>Customer:</strong> {{ autoReply.customerMessage }}</p>
                  <p><strong>Bot:</strong> {{ autoReply.replyText }}</p>
                  <p class="sim-notice" *ngIf="autoReply.simulated">This reply is saved in Live Inbox. A real WhatsApp phone receives it after the Meta number is connected.</p>
                  <a routerLink="/inbox">Open Live Inbox</a>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    .whatsapp-page {
      padding: 0;
      background: transparent;
      min-height: auto;
    }

    /* 1. Glowing Hero Gradient Card (Reference 4 & 5 Style) */
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

    .gateway-status-pill {
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

    .gateway-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 6px #4ade80;
    }

    /* 2. 4-Column Stat Cards Row (Reference 4 Style) */
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

    .kpi-number.phone-num-kpi {
      font-size: 1.05rem;
      font-family: monospace;
      letter-spacing: -0.01em;
    }

    .kpi-subtext {
      font-size: 0.6875rem;
      color: #64748b;
      font-weight: 500;
    }

    /* Alert Banner */
    .alert-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
    }

    .alert-banner.success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }

    .alert-banner.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .alert-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .alert-close {
      background: none;
      border: none;
      font-size: 0.9rem;
      cursor: pointer;
      color: inherit;
    }

    /* 3. Config Grid */
    .config-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 1.5rem;
    }

    .content-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .card-header-flex {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }

    .title-with-badge {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .icon-badge {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-badge.blue { background: #eff6ff; color: #2563eb; }
    .icon-badge.green { background: #ecfdf5; color: #059669; }
    .icon-badge.amber { background: #fffbeb; color: #d97706; }

    .icon-badge svg {
      width: 19px;
      height: 19px;
    }

    .card-main-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .card-sub-title {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0.15rem 0 0 0;
    }

    .card-body-form {
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
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
      transition: border-color 0.15s;
    }

    .form-control:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-control.code-font {
      font-family: monospace;
      font-size: 0.8rem;
      background: #f8fafc;
    }

    .form-hint {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .input-with-button {
      display: flex;
      gap: 0.5rem;
    }

    .btn-input-addon {
      padding: 0.65rem 1rem;
      font-size: 0.8rem;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      border-radius: 8px;
      cursor: pointer;
      white-space: nowrap;
    }

    .btn-input-addon:hover {
      background: #e2e8f0;
    }

    .webhook-card-inner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .webhook-tag {
      font-size: 0.7rem;
      font-weight: 800;
      color: #2563eb;
      letter-spacing: 0.06em;
    }

    .webhook-hdr p {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0.2rem 0 0;
    }

    .toggle-row-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 1rem 1.15rem;
    }

    .toggle-label-bold {
      font-size: 0.85rem;
      font-weight: 800;
      color: #1e40af;
      display: block;
    }

    .toggle-desc-sub {
      font-size: 0.75rem;
      color: #3b82f6;
      margin: 0.2rem 0 0;
      max-width: 380px;
    }

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

    .btn-save-primary {
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 700;
      border: none;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
      align-self: flex-start;
    }

    .btn-send-test {
      width: 100%;
      padding: 0.7rem;
      font-size: 0.85rem;
      font-weight: 700;
      border: none;
      background: #059669;
      color: #ffffff;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-send-test:hover {
      background: #047857;
    }

    .btn-sim-webhook {
      width: 100%;
      padding: 0.7rem;
      font-size: 0.85rem;
      font-weight: 700;
      border: none;
      background: #d97706;
      color: #ffffff;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-sim-webhook:hover {
      background: #b45309;
    }

    .result-banner {
      padding: 0.85rem 1rem;
      border-radius: 10px;
      font-size: 0.825rem;
    }

    .result-banner.success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }

    .result-banner.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .result-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
    }

    .sim-badge {
      font-size: 0.65rem;
      font-weight: 800;
      background: #dbeafe;
      color: #1e40af;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }

    .sim-notice {
      margin-top: 0.5rem;
      padding: 0.5rem 0.65rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      color: #1e40af;
      font-size: 0.75rem;
      line-height: 1.4;
    }

    .webhook-success-box {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 0.85rem 1rem;
      color: #92400e;
      font-size: 0.825rem;
      line-height: 1.45;
    }

    .wb-icon {
      font-weight: 800;
      background: #d97706;
      color: #ffffff;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      flex-shrink: 0;
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

  testRecipientPhone = '';
  testMessageText = 'Hello! This is a test verification message via SmartReply AI.';
  testResult: WhatsAppSendResult | null = null;

  simPhone = '+919000000001';
  simName = 'Customer';
  simText = 'What services do you offer?';
  autoReply: AutoReplyResult | null = null;

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
      },
      error: () => {
        this.formData = {
          accountId: '',
          phoneNumberId: '',
          phoneNumber: '',
          accessToken: '',
          webhookVerifyToken: '',
          appSecret: '',
          isSandbox: true
        };
      }
    });
  }

  saveConfig(): void {
    if (this.formData.accessToken && this.formData.phoneNumberId) {
      this.formData.isSandbox = false;
    }
    this.isSaving.set(true);
    this.whatsAppService.updateConfig(this.formData).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.config.set(res.data);
        this.alertType = 'success';
        this.alertMessage = res.data?.sandbox
          ? 'Saved. Automatic replies stay in this app until a Meta number is connected.'
          : 'WhatsApp number connected. Customer messages are answered automatically.';
      },
      error: () => {
        this.isSaving.set(false);
        this.alertType = 'error';
        this.alertMessage = 'Could not save the WhatsApp connection.';
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
      error: () => {
        this.isTestingSend.set(false);
        this.testResult = {
          success: false,
          status: 'FAILED',
          simulated: false,
          errorMessage: 'The message could not be sent.'
        };
      }
    });
  }

  simulateInboundWebhook(): void {
    this.isSimulatingHook.set(true);
    this.autoReply = null;
    this.whatsAppService.simulateWebhook(this.simPhone, this.simText, this.simName).subscribe({
      next: (res) => {
        this.isSimulatingHook.set(false);
        this.autoReply = res.data;
        this.loadConfig();
      },
      error: () => {
        this.isSimulatingHook.set(false);
        this.alertType = 'error';
        this.alertMessage = 'The automatic reply could not be created.';
      }
    });
  }

  copyToClipboard(text: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (text.includes('webhook')) {
      this.copiedUrl = true;
      setTimeout(() => this.copiedUrl = false, 2000);
    } else {
      this.copiedToken = true;
      setTimeout(() => this.copiedToken = false, 2000);
    }
  }
}
