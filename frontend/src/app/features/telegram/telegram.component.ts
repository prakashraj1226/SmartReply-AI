import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TelegramService, TelegramConfig, UpdateTelegramConfigRequest, TelegramSendResult, AutoReplyResult } from '../../core/services/telegram.service';

@Component({
  selector: 'app-telegram-integration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="telegram-page">

      <!-- 1. Glowing Hero Gradient Card (Matching Common App Style) -->
      <div class="hero-banner-card">
        <div class="hero-banner-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>TELEGRAM BOT API & DEMO SANDBOX</span>
          </div>
          <h1 class="hero-title">Official Telegram Bot Integration</h1>
          <p class="hero-subtitle">
            Connect a Telegram Bot for free, unlimited testing and team demos. Both Telegram and WhatsApp share the exact same AI brain, knowledge base, services, and Live Inbox.
          </p>
        </div>
        <div class="hero-actions">
          <div class="gateway-status-pill" [class.connected]="config()?.status === 'CONNECTED'" [class.sandbox]="config()?.sandbox">
            <span class="gateway-dot"></span>
            <span>{{ getStatusLabel() }}</span>
          </div>
        </div>
      </div>

      <!-- Channel Notice Banner -->
      <div class="channel-notice-card">
        <div class="notice-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <div class="notice-text">
          <strong>Testing & Demo Channel:</strong> Telegram Bot API has zero conversation fees and is ideal for staff training, internal demos, and customer journey testing. Real customer outreach in India still requires official Meta WhatsApp.
        </div>
        <a routerLink="/whatsapp" class="notice-link">View WhatsApp API ➔</a>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row -->
      <div class="kpi-grid">
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator cyan"></span>
              <span class="kpi-label">GATEWAY STATUS</span>
            </div>
            <div class="kpi-icon-box cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ config()?.sandbox ? 'Sandbox' : (config()?.status === 'CONNECTED' ? 'Connected' : 'Not Connected') }}</div>
          <div class="kpi-subtext">{{ config()?.sandbox ? 'In-app simulator enabled' : 'Official Telegram Bot API live' }}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator green"></span>
              <span class="kpi-label">BOT USERNAME</span>
            </div>
            <div class="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>
                <circle cx="12" cy="10" r="3"></circle>
                <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number bot-username-kpi">{{ config()?.botUsername ? '&#64;' + config()?.botUsername : 'Not Connected' }}</div>
          <div class="kpi-subtext">{{ config()?.botDisplayName || 'Verified with Telegram BotFather' }}</div>
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
              <span class="kpi-label">SHARED AI BRAIN</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z"></path>
                <path d="M16 11.37A4 4 0 1 1 12.63 8"></path>
                <path d="M12 22a7 7 0 0 0 7-7h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 7 7z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">Synchronized</div>
          <div class="kpi-subtext">Catalog, FAQs & appointments unified</div>
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

        <!-- LEFT: TELEGRAM BOT CREDENTIALS & SETUP CARD -->
        <div class="content-card">
          <div class="card-header-flex">
            <div class="title-with-badge">
              <div class="icon-badge cyan">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M22 2L11 13"></path>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </div>
              <div>
                <h3 class="card-main-title">Telegram Bot Credentials</h3>
                <p class="card-sub-title">Token from &#64;BotFather on Telegram</p>
              </div>
            </div>
          </div>

          <!-- SETUP STEPS HELPER BOX -->
          <div class="setup-steps-box">
            <h4 class="steps-title">4-Step Quick Bot Setup</h4>
            <ol class="setup-list">
              <li>Open Telegram, chat with <strong>&#64;BotFather</strong>, send <code>/newbot</code>, and copy the Bot Token.</li>
              <li>Paste the token below and click <strong>Save & Verify Bot</strong>.</li>
              <li>Set webhook to the shown HTTPS URL using Telegram's API or a webhook tool (Render / tunnel required for real delivery).</li>
              <li>Message your bot in Telegram — replies appear automatically in <strong>Live Inbox</strong>!</li>
            </ol>
          </div>

          <form (ngSubmit)="saveConfig()" class="card-body-form">
            <div class="form-group">
              <label>Telegram Bot Token *</label>
              <div class="input-with-button">
                <input
                  [type]="showToken ? 'text' : 'password'"
                  class="form-control"
                  [placeholder]="config()?.hasToken ? (config()?.maskedToken || '••••••••') : 'e.g. 7123456789:AAH...'"
                  [(ngModel)]="formData.botToken"
                  name="botToken"
                />
                <button type="button" class="btn-input-addon" (click)="showToken = !showToken">
                  {{ showToken ? 'Hide' : 'Show' }}
                </button>
              </div>
              <span class="form-hint" *ngIf="config()?.hasToken">
                ✓ Bot token configured: <code>{{ config()?.maskedToken }}</code>. Enter a new token only if you wish to change it.
              </span>
              <span class="form-hint" *ngIf="!config()?.hasToken">
                Obtain from Telegram's official &#64;BotFather. Never commit tokens to git.
              </span>
            </div>

            <div class="form-group" *ngIf="config()?.botUsername">
              <label>Connected Bot Username (Read-only)</label>
              <input
                type="text"
                class="form-control"
                [value]="'&#64;' + config()?.botUsername + (config()?.botDisplayName ? ' (' + config()?.botDisplayName + ')' : '')"
                readonly
              />
            </div>

            <!-- Webhook Box -->
            <div class="webhook-card-inner">
              <div class="webhook-hdr">
                <span class="webhook-tag">TELEGRAM WEBHOOK URL</span>
                <p>Telegram delivers inbound customer updates to this endpoint</p>
              </div>

              <div class="form-group">
                <label>Webhook URL (Resolved securely per business)</label>
                <div class="input-with-button">
                  <input
                    type="text"
                    class="form-control code-font"
                    [value]="config()?.webhookUrl || ''"
                    readonly
                  />
                  <button type="button" class="btn-input-addon" (click)="copyToClipboard(config()?.webhookUrl || '')">
                    {{ copiedUrl ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
                <span class="form-hint">
                  Note: Telegram Bot API requires a public <strong>HTTPS</strong> URL (Render, ngrok, or Cloudflare tunnel). Localhost alone cannot receive incoming webhooks directly from Telegram.
                </span>
              </div>

              <div class="form-group">
                <label>Webhook Secret Key</label>
                <div class="input-with-button">
                  <input
                    type="text"
                    class="form-control code-font"
                    [(ngModel)]="formData.webhookSecret"
                    name="webhookSecret"
                  />
                  <button type="button" class="btn-input-addon" (click)="copyToClipboard(formData.webhookSecret || '')">
                    {{ copiedToken ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
                <span class="form-hint">Passed in X-Telegram-Bot-Api-Secret-Token to isolate tenants</span>
              </div>
            </div>

            <!-- Sandbox Mode Switch -->
            <div class="toggle-row-card">
              <div>
                <label class="toggle-label-bold">Sandbox Simulator Mode</label>
                <p class="toggle-desc-sub">Simulates Telegram customer inquiries & AI replies in-app without requiring active BotFather credentials.</p>
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
                <span *ngIf="!isSaving()">Save & Verify Bot</span>
                <span *ngIf="isSaving()" class="spinner-sm"></span>
              </button>
            </div>
          </form>
        </div>

        <!-- RIGHT: LIVE INBOX SIMULATOR & TEST OUTBOUND -->
        <div class="testing-column">

          <!-- SIMULATE INCOMING TELEGRAM CUSTOMER -->
          <div class="content-card">
            <div class="card-header-flex">
              <div class="title-with-badge">
                <div class="icon-badge amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <div>
                  <h3 class="card-main-title">Automatic Reply Simulator</h3>
                  <p class="card-sub-title">Test AI grounding with your services, prices & appointments</p>
                </div>
              </div>
            </div>

            <div class="card-body-form">
              <div class="form-row-2">
                <div class="form-group">
                  <label>Telegram User ID / Chat ID</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="simUserId"
                    placeholder="987654321"
                  />
                  <span class="form-hint">Stored as tg:userId</span>
                </div>
                <div class="form-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="simName"
                    placeholder="Priya Raman"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Telegram Username (Optional)</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="simUsername"
                  placeholder="priya_raman"
                />
              </div>

              <div class="form-group">
                <label>Customer Question</label>
                <textarea
                  class="form-control"
                  rows="2"
                  [(ngModel)]="simText"
                  placeholder="e.g. Do you have appointments available tomorrow for haircut?"
                ></textarea>
                <div class="quick-pill-row">
                  <span class="quick-pill-label">Quick Test:</span>
                  <button type="button" class="quick-pill" (click)="simText = '/start'">🚀 /start (First Welcome)</button>
                  <button type="button" class="quick-pill" (click)="simText = 'Hello'">👋 Hello</button>
                  <button type="button" class="quick-pill" (click)="simText = 'What are your dental cleaning charges and timings?'">🩺 Services & Hours</button>
                  <button type="button" class="quick-pill" (click)="simText = 'Do you have appointments tomorrow at 10 AM?'">📅 Book Slot</button>
                </div>
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
                <div class="reply-card-inner">
                  <div class="reply-row customer-row">
                    <span class="reply-badge cust-badge">Customer</span>
                    <p class="reply-bubble">{{ autoReply.customerMessage }}</p>
                  </div>
                  <div class="reply-row bot-row">
                    <span class="reply-badge bot-badge">SmartReply Bot</span>
                    <p class="reply-bubble bot-bubble">{{ autoReply.replyText }}</p>
                  </div>
                  <div class="reply-footer">
                    <span class="sim-notice-inline" *ngIf="autoReply.simulated">✓ Saved directly to Live Inbox</span>
                    <a routerLink="/inbox" class="live-inbox-link">Open Live Inbox ➔</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TEST OUTBOUND DIRECT TELEGRAM MESSAGE (Optional if bot is connected) -->
          <div class="content-card" *ngIf="config()?.hasToken">
            <div class="card-header-flex">
              <div class="title-with-badge">
                <div class="icon-badge cyan">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </div>
                <div>
                  <h3 class="card-main-title">Dispatch Test Outbound Message</h3>
                  <p class="card-sub-title">Send a message directly from your bot to a Telegram Chat ID</p>
                </div>
              </div>
            </div>

            <div class="card-body-form">
              <div class="form-group">
                <label>Telegram Chat ID</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. 123456789"
                  [(ngModel)]="testChatId"
                />
                <span class="form-hint">Obtain from &#64;userinfobot or message the bot first</span>
              </div>

              <div class="form-group">
                <label>Message Content</label>
                <textarea
                  class="form-control"
                  rows="2"
                  [(ngModel)]="testMessageText"
                  placeholder="Test greeting from SmartReply AI..."
                ></textarea>
              </div>

              <button
                type="button"
                class="btn-send-test"
                [disabled]="isTestingSend() || !testChatId.trim() || !testMessageText.trim()"
                (click)="sendTestMessage()"
              >
                <span *ngIf="!isTestingSend()">Dispatch Test Message ➔</span>
                <span *ngIf="isTestingSend()" class="spinner-sm"></span>
              </button>

              <div *ngIf="testResult" class="result-banner" [class.success]="testResult.success" [class.error]="!testResult.success">
                <div class="result-title-row">
                  <strong>{{ testResult.success ? (testResult.simulated ? '✓ In-App Simulated' : '✓ Telegram Dispatched') : '✗ Dispatch Failed' }}</strong>
                  <span class="sim-badge" *ngIf="testResult.simulated">Sandbox Simulator</span>
                </div>
                <p *ngIf="testResult.messageId">Message ID: <code>{{ testResult.messageId }}</code></p>
                <p *ngIf="testResult.errorMessage" class="error-msg">{{ testResult.errorMessage }}</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    .telegram-page {
      padding: 0;
      background: transparent;
      min-height: auto;
    }

    /* 1. Glowing Hero Gradient Card (Matching WhatsApp style exactly) */
    .hero-banner-card {
      background: radial-gradient(120% 140% at 88% 12%, rgba(14, 165, 233, 0.32) 0%, rgba(2, 132, 199, 0.18) 40%, transparent 70%),
                  radial-gradient(100% 100% at 12% 88%, rgba(56, 189, 248, 0.22) 0%, transparent 60%),
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
      background: radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, transparent 70%);
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
      background: rgba(14, 165, 233, 0.18);
      border: 1px solid rgba(56, 189, 248, 0.35);
      backdrop-filter: blur(8px);
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      margin-bottom: 0.35rem;
      color: #38bdf8;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
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
      background: rgba(14, 165, 233, 0.2);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #38bdf8;
      padding: 0.4rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.725rem;
      font-weight: 800;
      letter-spacing: 0.03em;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
      white-space: nowrap;
    }

    .gateway-status-pill.connected {
      background: rgba(34, 197, 94, 0.2);
      border-color: rgba(74, 222, 128, 0.4);
      color: #4ade80;
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
    }

    .gateway-status-pill.sandbox {
      background: rgba(245, 158, 11, 0.2);
      border-color: rgba(251, 191, 36, 0.4);
      color: #fbbf24;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
    }

    .gateway-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 6px currentColor;
    }

    /* Channel Notice Banner */
    .channel-notice-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      margin-bottom: 0.85rem;
      color: #0369a1;
      font-size: 0.775rem;
    }

    .notice-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      color: #0284c7;
    }

    .notice-text {
      flex: 1;
      line-height: 1.45;
      color: #0c4a6e;
    }

    .notice-link {
      color: #0284c7;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      transition: color 0.15s ease;
    }

    .notice-link:hover {
      color: #0369a1;
      text-decoration: underline;
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
      box-shadow: 0 10px 20px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(14, 165, 233, 0.06);
      border-color: #cbd5e1;
    }

    .kpi-card:hover::before {
      background: linear-gradient(90deg, #0ea5e9, #7dd3fc);
    }

    .kpi-card.active-accent {
      border-color: #bae6fd;
      box-shadow: 0 4px 14px -2px rgba(14, 165, 233, 0.14), 0 0 0 1px rgba(14, 165, 233, 0.15);
    }

    .kpi-card.active-accent::before {
      background: linear-gradient(90deg, #0284c7, #38bdf8);
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

    .status-indicator.cyan { background: #0284c7; box-shadow: 0 0 6px rgba(2, 132, 199, 0.5); }
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

    .kpi-icon-box.cyan { background: #f0f9ff; color: #0284c7; border: 1px solid #e0f2fe; }
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

    .kpi-number.bot-username-kpi {
      font-size: 1.05rem;
      color: #0284c7;
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
      margin-bottom: 1.25rem;
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

    /* 3. Side-by-Side Config Grid */
    .config-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 1.5rem;
    }

    .content-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
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

    .icon-badge svg {
      width: 19px;
      height: 19px;
    }

    .icon-badge.cyan { background: #f0f9ff; color: #0284c7; }
    .icon-badge.amber { background: #fffbeb; color: #d97706; }

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

    /* Setup Steps Helper Box */
    .setup-steps-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #0284c7;
      border-radius: 10px;
      padding: 0.95rem 1.15rem;
      margin: 1.25rem 1.5rem 0 1.5rem;
    }

    .steps-title {
      font-size: 0.725rem;
      font-weight: 800;
      color: #0284c7;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 0.5rem 0;
    }

    .setup-list {
      margin: 0;
      padding-left: 1.15rem;
      color: #334155;
      font-size: 0.775rem;
      line-height: 1.55;
    }

    .setup-list li {
      margin-bottom: 0.3rem;
    }

    .setup-list code {
      background: #e2e8f0;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      color: #0f172a;
      font-size: 0.725rem;
      font-family: monospace;
    }

    /* Form styling */
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
      background: #f8fafc;
      color: #0f172a;
      transition: border-color 0.15s;
    }

    .form-control:focus {
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
      background: #ffffff;
    }

    .form-control.code-font {
      font-family: monospace;
      font-size: 0.8rem;
      background: #f8fafc;
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
      transition: background 0.15s ease;
    }

    .btn-input-addon:hover {
      background: #e2e8f0;
    }

    .form-hint {
      font-size: 0.7rem;
      color: #64748b;
    }

    .form-hint code {
      background: #e2e8f0;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      color: #0f172a;
    }

    /* Webhook Inner Card */
    .webhook-card-inner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .webhook-hdr {
      margin-bottom: 0.25rem;
    }

    .webhook-tag {
      font-size: 0.7rem;
      font-weight: 800;
      color: #0284c7;
      letter-spacing: 0.06em;
    }

    .webhook-hdr p {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0.2rem 0 0;
    }

    /* Toggle switch row */
    .toggle-row-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 1rem 1.15rem;
    }

    .toggle-label-bold {
      font-size: 0.85rem;
      font-weight: 800;
      color: #0369a1;
      display: block;
    }

    .toggle-desc-sub {
      font-size: 0.75rem;
      color: #0284c7;
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
      background-color: #0284c7;
    }

    .switch-ui input:checked + .slider-ui:before {
      transform: translateX(20px);
    }

    .form-actions-bar {
      display: flex;
      justify-content: flex-start;
      margin-top: 0.5rem;
    }

    .btn-save-primary {
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 700;
      border: none;
      background: linear-gradient(135deg, #0284c7, #0369a1);
      color: #ffffff;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .btn-save-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(2, 132, 199, 0.45);
    }

    .btn-save-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .quick-pill-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.5rem;
    }

    .quick-pill-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
    }

    .quick-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      padding: 0.25rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .quick-pill:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
      color: #0f172a;
      transform: translateY(-1px);
    }

    /* Testing Simulator Buttons */
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

    .btn-sim-webhook:hover:not(:disabled) {
      background: #b45309;
    }

    .btn-send-test {
      width: 100%;
      padding: 0.7rem;
      font-size: 0.85rem;
      font-weight: 700;
      border: none;
      background: #0284c7;
      color: #ffffff;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-send-test:hover:not(:disabled) {
      background: #0369a1;
    }

    .webhook-success-box {
      margin-top: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
    }

    .reply-card-inner {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .reply-row {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .reply-badge {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      width: fit-content;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }

    .cust-badge {
      background: #e2e8f0;
      color: #475569;
    }

    .bot-badge {
      background: #e0f2fe;
      color: #0284c7;
    }

    .reply-bubble {
      margin: 0;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      font-size: 0.825rem;
      line-height: 1.45;
      background: #f1f5f9;
      color: #0f172a;
    }

    .bot-bubble {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e3a8a;
    }

    .reply-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.25rem;
      padding-top: 0.65rem;
      border-top: 1px solid #e2e8f0;
    }

    .sim-notice-inline {
      font-size: 0.75rem;
      font-weight: 600;
      color: #059669;
    }

    .live-inbox-link {
      font-size: 0.775rem;
      font-weight: 700;
      color: #0284c7;
      text-decoration: none;
    }

    .live-inbox-link:hover {
      text-decoration: underline;
    }

    .result-banner {
      margin-top: 1rem;
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
      background: #fef3c7;
      color: #92400e;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }

    .spinner-sm {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 960px) {
      .config-grid {
        grid-template-columns: 1fr;
      }
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .hero-banner-card {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class TelegramIntegrationComponent implements OnInit {
  config = signal<TelegramConfig | null>(null);
  formData: UpdateTelegramConfigRequest = {
    botToken: '',
    isSandbox: true,
    webhookSecret: ''
  };

  showToken = false;
  copiedUrl = false;
  copiedToken = false;

  isSaving = signal(false);
  isTestingSend = signal(false);
  isSimulatingHook = signal(false);

  alertMessage = '';
  alertType: 'success' | 'error' = 'success';

  // Simulator state
  simUserId = '987654321';
  simName = 'Priya Raman';
  simUsername = 'priya_raman';
  simText = 'What are your dental cleaning charges and timings?';
  autoReply: AutoReplyResult | null = null;

  // Test Outbound state
  testChatId = '';
  testMessageText = 'Hello from SmartReply AI Telegram Bot!';
  testResult: TelegramSendResult | null = null;

  constructor(private telegramService: TelegramService) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.telegramService.getConfig().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.config.set(res.data);
          this.formData = {
            botToken: '',
            isSandbox: res.data.sandbox,
            webhookSecret: res.data.webhookVerifyToken || ''
          };
        }
      },
      error: (err) => {
        this.showAlert(err.error?.message || 'Failed to load Telegram configuration', 'error');
      }
    });
  }

  saveConfig(): void {
    this.isSaving.set(true);
    this.telegramService.updateConfig(this.formData).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success && res.data) {
          this.config.set(res.data);
          this.formData.botToken = '';
          this.formData.webhookSecret = res.data.webhookVerifyToken || '';
          this.formData.isSandbox = res.data.sandbox;
          this.showAlert(res.message || 'Telegram Bot settings saved successfully!', 'success');
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.showAlert(err.error?.message || 'Failed to save Telegram settings', 'error');
      }
    });
  }

  simulateInboundWebhook(): void {
    if (!this.simText.trim()) return;

    this.isSimulatingHook.set(true);
    this.autoReply = null;

    this.telegramService.simulateWebhook({
      text: this.simText.trim(),
      fromUserId: this.simUserId.trim(),
      senderName: this.simName.trim(),
      username: this.simUsername.trim()
    }).subscribe({
      next: (res) => {
        this.isSimulatingHook.set(false);
        if (res.success && res.data) {
          this.autoReply = res.data;
          this.showAlert('Simulated message processed! Reply generated and stored in Live Inbox.', 'success');
        }
      },
      error: (err) => {
        this.isSimulatingHook.set(false);
        this.showAlert(err.error?.message || 'Simulation failed', 'error');
      }
    });
  }

  sendTestMessage(): void {
    if (!this.testChatId.trim() || !this.testMessageText.trim()) return;

    this.isTestingSend.set(true);
    this.testResult = null;

    this.telegramService.testSend(this.testChatId.trim(), this.testMessageText.trim()).subscribe({
      next: (res) => {
        this.isTestingSend.set(false);
        if (res.data) {
          this.testResult = res.data;
          if (res.data.success) {
            this.showAlert('Telegram test message dispatched!', 'success');
          } else {
            this.showAlert(res.data.errorMessage || 'Failed to dispatch Telegram message', 'error');
          }
        }
      },
      error: (err) => {
        this.isTestingSend.set(false);
        this.testResult = {
          success: false,
          status: 'ERROR',
          errorMessage: err.error?.message || 'Test dispatch failed',
          simulated: false
        };
      }
    });
  }

  copyToClipboard(text: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copiedUrl = true;
      setTimeout(() => this.copiedUrl = false, 2000);
    });
  }

  getStatusLabel(): string {
    const cfg = this.config();
    if (!cfg) return 'CHECKING...';
    if (cfg.sandbox) return 'SANDBOX SIMULATOR';
    if (cfg.status === 'CONNECTED') return 'CONNECTED';
    if (cfg.status === 'ERROR') return 'CONNECTION ERROR';
    return 'NOT CONNECTED';
  }

  private showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    if (type === 'success') {
      setTimeout(() => {
        if (this.alertMessage === message) {
          this.alertMessage = '';
        }
      }, 5000);
    }
  }
}
