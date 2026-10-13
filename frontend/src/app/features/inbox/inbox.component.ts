import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InboxService, ConversationDto, MessageDto } from '../../core/services/inbox.service';
import { CustomerService, Customer } from '../../core/services/customer.service';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inbox-page">

      <!-- 1. Glowing Hero Gradient Card (Reference 4 & 5 Style) -->
      <div class="hero-banner-card">
        <div class="hero-banner-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>LIVE WHATSAPP COMMS & AI AUTO-PILOT</span>
          </div>
          <h1 class="hero-title">Live Omni-Channel Inbox</h1>
          <p class="hero-subtitle">
            Real-time customer WhatsApp messaging stream with AI autonomous grounding and instant staff handoff.
          </p>
        </div>
        <div class="hero-actions">
          <button type="button" class="btn-hero-primary" (click)="openSimulateModal()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>Simulate Inbound Message</span>
          </button>
        </div>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row (Reference 4 Style) -->
      <div class="kpi-grid">
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator blue"></span>
              <span class="kpi-label">ACTIVE CHATS</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ conversations().length || 5 }}</div>
          <div class="kpi-subtext">Active WhatsApp patient threads</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator green"></span>
              <span class="kpi-label">AI AUTO-PILOT RATE</span>
            </div>
            <div class="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="kpi-number">94.2%</div>
          <div class="kpi-subtext">Resolved autonomously from FAQ</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator amber"></span>
              <span class="kpi-label">NEEDS ESCALATION</span>
            </div>
            <div class="kpi-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
          </div>
          <div class="kpi-number">1 Chat</div>
          <div class="kpi-subtext">Flagged for doctor clinical review</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">AVG REPLY LATENCY</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-number">1.1s</div>
          <div class="kpi-subtext">Meta Cloud API instant webhook</div>
        </div>
      </div>

      <!-- 3. Modern 3-Column Chat Application Frame -->
      <div class="inbox-workspace-card">

        <!-- LEFT PANEL: Conversation Directory -->
        <aside class="left-panel">
          <div class="panel-header">
            <div class="search-box">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search patients or messages..."
                [(ngModel)]="searchQuery"
                (input)="onSearchChange()"
              />
              <button *ngIf="searchQuery" class="clear-btn" (click)="clearSearch()">✕</button>
            </div>

            <!-- Filter Status Tabs -->
            <div class="filter-tabs">
              <button [class.active]="selectedStatus() === 'ALL'" (click)="setStatusFilter('ALL')">All</button>
              <button [class.active]="selectedStatus() === 'OPEN'" (click)="setStatusFilter('OPEN')">Open</button>
              <button [class.active]="selectedStatus() === 'PENDING'" (click)="setStatusFilter('PENDING')">Pending</button>
              <button [class.active]="selectedStatus() === 'RESOLVED'" (click)="setStatusFilter('RESOLVED')">Resolved</button>
            </div>
          </div>

          <!-- Conversations Scroll List -->
          <div class="conversations-scroll">
            <div *ngIf="isLoadingList()" class="loading-state">
              <div class="spinner"></div>
              <p>Loading conversations...</p>
            </div>

            <div
              *ngFor="let conv of conversations()"
              class="conversation-item"
              [class.selected]="selectedConversation()?.id === conv.id"
              [class.unread]="conv.unreadCount > 0"
              (click)="selectConversation(conv)"
            >
              <div class="avatar-badge" [ngStyle]="{'background-color': getAvatarColor(conv.customerName)}">
                {{ getInitials(conv.customerName) }}
              </div>

              <div class="conv-content">
                <div class="conv-top-row">
                  <span class="customer-name">{{ conv.customerName }}</span>
                  <span class="timestamp">{{ formatTime(conv.lastMessageAt || conv.createdAt) }}</span>
                </div>
                <div class="conv-snippet-row">
                  <span class="snippet">{{ conv.lastMessageSnippet || 'No messages yet' }}</span>
                  <span *ngIf="conv.unreadCount > 0" class="unread-pill">{{ conv.unreadCount }}</span>
                </div>
                <div class="conv-meta-row">
                  <span class="status-pill" [attr.data-status]="conv.status">{{ conv.status }}</span>
                  <span *ngIf="conv.aiEnabled" class="ai-badge">✨ AI Grounded</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- MIDDLE PANEL: Live WhatsApp Message Stream & Composer -->
        <main class="middle-panel" *ngIf="selectedConversation(); else noSelectionTpl">
          <!-- Chat Header -->
          <header class="chat-header">
            <div class="chat-header-info">
              <div class="avatar-header" [ngStyle]="{'background-color': getAvatarColor(selectedConversation()!.customerName)}">
                {{ getInitials(selectedConversation()!.customerName) }}
              </div>
              <div class="header-titles">
                <div class="header-name-row">
                  <h3>{{ selectedConversation()!.customerName }}</h3>
                  <span class="phone-chip">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    {{ selectedConversation()!.customerPhone }}
                  </span>
                </div>
                <div class="header-sub">
                  <span class="live-dot-indicator"></span>
                  <span class="status-text">{{ selectedConversation()!.status }}</span>
                  <span class="dot-separator">•</span>
                  <span *ngIf="selectedConversation()!.aiEnabled" class="ai-active-text">
                    ✨ AI Assistant ON (Auto-Reply)
                  </span>
                  <span *ngIf="!selectedConversation()!.aiEnabled" class="ai-paused-text">
                    ⏸ AI Paused (Human Takeover)
                  </span>
                </div>
              </div>
            </div>

            <div class="chat-header-actions">
              <button
                class="btn-hdr-action"
                [class.resolved]="selectedConversation()!.status === 'RESOLVED'"
                (click)="toggleResolve()"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {{ selectedConversation()!.status === 'RESOLVED' ? 'Reopen Conversation' : 'Mark Resolved' }}
              </button>
              <button
                class="btn-hdr-action ai-toggle"
                [class.ai-off]="!selectedConversation()!.aiEnabled"
                (click)="toggleAiMode()"
              >
                {{ selectedConversation()!.aiEnabled ? 'Pause AI' : 'Resume AI' }}
              </button>
            </div>
          </header>

          <!-- Messages Container -->
          <div class="messages-container" #messagesContainer>
            <div *ngIf="isLoadingMessages()" class="loading-state">
              <div class="spinner"></div>
              <p>Fetching WhatsApp conversation log...</p>
            </div>

            <div *ngFor="let msg of messages()" class="message-wrapper" [ngClass]="msg.senderType.toLowerCase()">

              <!-- Patient / Customer Bubble -->
              <div *ngIf="msg.senderType === 'CUSTOMER'" class="bubble customer-bubble">
                <div class="bubble-sender">{{ selectedConversation()!.customerName }}</div>
                <div class="bubble-text">{{ msg.textContent }}</div>
                <div class="bubble-meta">
                  <span>{{ formatTime(msg.createdAt) }}</span>
                </div>
              </div>

              <!-- Human Staff Agent Bubble -->
              <div *ngIf="msg.senderType === 'AGENT'" class="bubble agent-bubble">
                <div class="bubble-sender">Clinic Staff Agent</div>
                <div class="bubble-text">{{ msg.textContent }}</div>
                <div class="bubble-meta">
                  <span>{{ formatTime(msg.createdAt) }}</span>
                  <span class="status-tick">{{ getStatusTick(msg.deliveryStatus) }}</span>
                </div>
              </div>

              <!-- AI Auto-Reply Bubble -->
              <div *ngIf="msg.senderType === 'AI'" class="bubble ai-bubble">
                <div class="bubble-sender">
                  <span class="ai-spark-icon">✨</span>
                  <span>SmartReply AI (Autonomous)</span>
                  <span class="confidence-tag">98% Grounded</span>
                </div>
                <div class="bubble-text">{{ msg.textContent }}</div>
                <div class="bubble-meta">
                  <span>{{ formatTime(msg.createdAt) }}</span>
                  <span class="status-tick">✓ Delivered</span>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Suggested Replies Chip Bar -->
          <div class="suggestions-bar">
            <div class="suggestion-label">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Instant AI Suggestions:</span>
            </div>
            <div class="suggestions-list">
              <button
                *ngFor="let suggestion of (suggestedReplies().length > 0 ? suggestedReplies() : defaultSuggestions)"
                class="suggestion-chip"
                (click)="applySuggestion(suggestion)"
              >
                {{ truncate(suggestion, 48) }}
              </button>
            </div>
          </div>

          <!-- Message Composer Footer -->
          <footer class="composer-container">
            <div class="composer-input-row">
              <textarea
                [(ngModel)]="outgoingMessageText"
                placeholder="Type reply as clinic staff (Shift + Enter for new line)..."
                rows="2"
                (keydown.enter)="onEnterPress($event)"
              ></textarea>
              <button
                class="btn-send-message"
                [disabled]="isSending() || !outgoingMessageText.trim()"
                (click)="sendMessage()"
              >
                <span *ngIf="!isSending()">Send ➔</span>
                <span *ngIf="isSending()" class="spinner-sm"></span>
              </button>
            </div>
          </footer>
        </main>

        <ng-template #noSelectionTpl>
          <main class="middle-panel empty-selection">
            <div class="empty-state-box">
              <div class="empty-icon-lg">💬</div>
              <h3>Select a Conversation</h3>
              <p>Choose a patient from the left column or trigger a simulated WhatsApp message to preview real-time AI reply.</p>
              <button class="btn-hero-primary" (click)="openSimulateModal()">⚡ Simulate Customer Inbound</button>
            </div>
          </main>
        </ng-template>

        <!-- RIGHT PANEL: Patient Card & Grounding Context -->
        <aside class="right-panel" *ngIf="selectedConversation()">
          <div class="panel-section">
            <h4 class="section-title">Patient Profile</h4>
            <div class="profile-card">
              <div class="profile-avatar" [ngStyle]="{'background-color': getAvatarColor(selectedConversation()!.customerName)}">
                {{ getInitials(selectedConversation()!.customerName) }}
              </div>
              <h5 class="profile-name">{{ selectedConversation()!.customerName }}</h5>
              <p class="profile-phone">{{ selectedConversation()!.customerPhone }}</p>

              <div class="profile-stats-grid">
                <div class="pstat-item">
                  <span class="pstat-label">Channel</span>
                  <span class="pstat-val wa">WhatsApp Cloud</span>
                </div>
                <div class="pstat-item">
                  <span class="pstat-label">Opt-In Status</span>
                  <span class="pstat-val opt-in">Verified</span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-section">
            <h4 class="section-title">AI Grounding Autopilot</h4>
            <div class="ai-card-info">
              <p class="ai-desc">
                When active, all customer questions matching clinic FAQs are answered instantly in 1.1s.
              </p>
              <button
                class="btn-ai-control"
                [class.active-ai]="selectedConversation()!.aiEnabled"
                (click)="toggleAiMode()"
              >
                {{ selectedConversation()!.aiEnabled ? 'Pause AI Autopilot' : 'Activate AI Autopilot' }}
              </button>
            </div>
          </div>

          <div class="panel-section">
            <h4 class="section-title">Quick Actions</h4>
            <div class="quick-actions-col">
              <button class="action-btn-item" (click)="loadSuggestions()">
                <span>🔄</span> Refresh AI Reply Suggestions
              </button>
              <button class="action-btn-item" (click)="openSimulateModal()">
                <span>⚡</span> Send Simulated Inbound
              </button>
            </div>
          </div>
        </aside>
      </div>

      <!-- SIMULATE INCOMING MODAL -->
      <div *ngIf="showSimulateModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-title-box">
              <div class="modal-icon-badge">⚡</div>
              <div>
                <h3>Simulate Incoming WhatsApp Message</h3>
                <p class="modal-subtitle">Tests the Meta webhook and AI FAQ grounding engine in real time</p>
              </div>
            </div>
            <button class="close-btn" (click)="closeSimulateModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Select Patient</label>
              <select [(ngModel)]="simulateCustomerId" class="form-control">
                <option *ngFor="let c of customerList()" [value]="c.id">
                  {{ c.name }} ({{ c.phoneNumber }})
                </option>
                <option *ngIf="customerList().length === 0" value="cust-user-1">
                  Prakash Raj (+91 90944 60709) [Your WhatsApp]
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>WhatsApp Message Content</label>
              <textarea
                [(ngModel)]="simulateMessageText"
                rows="3"
                class="form-control"
                placeholder="e.g. What are your opening hours? Or, How much is root canal treatment?"
              ></textarea>
            </div>

            <div class="sample-chips">
              <span class="chip-label">Quick samples:</span>
              <button class="sample-chip" (click)="setSampleText('What are your opening hours on Saturday?')">Opening Hours</button>
              <button class="sample-chip" (click)="setSampleText('How much is dental scaling and polishing?')">Pricing (₹800)</button>
              <button class="sample-chip" (click)="setSampleText('I have severe emergency tooth pain today!')">Emergency Pain</button>
              <button class="sample-chip" (click)="setSampleText('Can I book an appointment tomorrow at 4:30 PM?')">Book Slot</button>
              <button class="sample-chip" (click)="setSampleText('Who is the chief dental doctor at your clinic?')">Doctor Info</button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeSimulateModal()">Cancel</button>
            <button
              class="btn-send-sim"
              [disabled]="isSimulating() || !simulateMessageText.trim()"
              (click)="triggerSimulateInbound()"
            >
              <span *ngIf="!isSimulating()">Send Simulated WhatsApp</span>
              <span *ngIf="isSimulating()" class="spinner-sm"></span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .inbox-page {
      padding: 0;
      background: transparent;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 48px - 1.5rem);
      max-height: calc(100vh - 48px - 1.5rem);
      overflow: hidden;
      box-sizing: border-box;
      gap: 0.6rem;
    }

    /* 1. Glowing Hero Gradient Card (Sleek, Compact) */
    .hero-banner-card {
      background: radial-gradient(120% 140% at 88% 12%, rgba(59, 130, 246, 0.32) 0%, rgba(37, 99, 235, 0.16) 40%, transparent 70%),
                  radial-gradient(100% 100% at 12% 88%, rgba(99, 102, 241, 0.22) 0%, transparent 60%),
                  linear-gradient(135deg, #091326 0%, #0d2149 55%, #081024 100%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 0.6rem 1.15rem;
      min-height: auto;
      color: #ffffff;
      box-shadow: 0 4px 16px -2px rgba(11, 19, 41, 0.35);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      box-sizing: border-box;
      flex-shrink: 0;
      margin-bottom: 0;
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
      gap: 0.35rem;
      background: rgba(34, 197, 94, 0.14);
      border: 1px solid rgba(74, 222, 128, 0.32);
      backdrop-filter: blur(8px);
      padding: 0.15rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      margin-bottom: 0.25rem;
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
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: #ffffff !important;
      margin: 0 0 0.15rem 0;
      line-height: 1.2;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    }

    .hero-subtitle {
      font-size: 0.725rem;
      color: #cbd5e1;
      margin: 0;
      line-height: 1.35;
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
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      font-size: 0.75rem;
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

    /* 2. 4-Column Stat Cards Row (Compact, Sleek) */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.6rem;
      flex-shrink: 0;
      margin-bottom: 0;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.5rem 0.85rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2.5px;
      background: transparent;
      transition: all 0.2s ease;
    }

    .kpi-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 14px -2px rgba(15, 23, 42, 0.08);
      border-color: #cbd5e1;
    }

    .kpi-card:hover::before {
      background: linear-gradient(90deg, #3b82f6, #93c5fd);
    }

    .kpi-card.active-accent {
      border-color: #bfdbfe;
      box-shadow: 0 3px 10px -2px rgba(37, 99, 235, 0.12);
    }

    .kpi-card.active-accent::before {
      background: linear-gradient(90deg, #2563eb, #60a5fa);
    }

    .kpi-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .kpi-label-box {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .status-indicator {
      width: 5px;
      height: 5px;
      border-radius: 50%;
    }

    .status-indicator.blue { background: #2563eb; box-shadow: 0 0 5px rgba(37, 99, 235, 0.5); }
    .status-indicator.green { background: #10b981; box-shadow: 0 0 5px rgba(16, 185, 129, 0.5); }
    .status-indicator.amber { background: #f59e0b; box-shadow: 0 0 5px rgba(245, 158, 11, 0.5); }
    .status-indicator.purple { background: #8b5cf6; box-shadow: 0 0 5px rgba(139, 92, 246, 0.5); }

    .kpi-label {
      font-size: 0.625rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .kpi-icon-box {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-icon-box svg {
      width: 13px;
      height: 13px;
    }

    .kpi-icon-box.blue { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
    .kpi-icon-box.green { background: #f0fdf4; color: #059669; border: 1px solid #dcfce7; }
    .kpi-icon-box.amber { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
    .kpi-icon-box.purple { background: #faf5ff; color: #7c3aed; border: 1px solid #f3e8ff; }

    .kpi-number {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      line-height: 1.15;
      margin-bottom: 0.15rem;
    }

    .kpi-subtext {
      font-size: 0.65rem;
      color: #64748b;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* 3. Modern 3-Column Chat Frame */
    .inbox-workspace-card {
      display: flex;
      flex: 1 1 0%;
      min-height: 0;
      height: 100%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 3px 16px -2px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    /* Left Panel */
    .left-panel {
      width: 290px;
      min-width: 260px;
      max-width: 320px;
      flex-shrink: 0;
      border-right: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }

    .panel-header {
      padding: 1.1rem 1.1rem 0.85rem;
      border-bottom: 1px solid #f1f5f9;
      background: #ffffff;
    }

    .search-box {
      position: relative;
      margin-bottom: 0.75rem;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 15px;
      height: 15px;
      color: #94a3b8;
    }

    .search-box input {
      width: 100%;
      padding: 0.55rem 1.75rem 0.55rem 2.2rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.825rem;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s;
    }

    .search-box input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .clear-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.75rem;
    }

    .filter-tabs {
      display: flex;
      gap: 4px;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
    }

    .filter-tabs button {
      flex: 1;
      padding: 0.35rem 0.5rem;
      font-size: 0.725rem;
      font-weight: 700;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: all 0.18s;
    }

    .filter-tabs button.active {
      background: #ffffff;
      color: #2563eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .conversations-scroll {
      flex: 1 1 0%;
      min-height: 0;
      overflow-y: auto;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f8fafc;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .conversation-item:hover {
      background: #f8fafc;
    }

    .conversation-item.selected {
      background: #eff6ff;
      border-left: 3.5px solid #2563eb;
    }

    .avatar-badge {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .conv-content {
      flex: 1;
      min-width: 0;
    }

    .conv-top-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.2rem;
    }

    .customer-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .timestamp {
      font-size: 0.6875rem;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .conv-snippet-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
    }

    .snippet {
      font-size: 0.775rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 175px;
    }

    .unread-pill {
      background: #2563eb;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.1rem 0.45rem;
      border-radius: 9999px;
    }

    .conv-meta-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .status-pill {
      font-size: 0.625rem;
      font-weight: 800;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .status-pill[data-status="OPEN"] { background: #dcfce7; color: #15803d; }
    .status-pill[data-status="PENDING"] { background: #fef3c7; color: #b45309; }
    .status-pill[data-status="RESOLVED"] { background: #f1f5f9; color: #64748b; }

    .ai-badge {
      font-size: 0.625rem;
      font-weight: 700;
      color: #2563eb;
      background: #dbeafe;
      padding: 0.125rem 0.45rem;
      border-radius: 4px;
    }

    /* Middle Panel */
    .middle-panel {
      flex: 1 1 0%;
      min-width: 0;
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      overflow: hidden;
      position: relative;
    }

    .chat-header {
      flex-shrink: 0;
      padding: 0.75rem 1.15rem;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }

    .chat-header-info {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .avatar-header {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-titles h3 {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .header-name-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .phone-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.725rem;
      font-weight: 600;
      color: #059669;
      background: #ecfdf5;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }

    .header-sub {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.2rem;
    }

    .live-dot-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }

    .status-text {
      font-weight: 700;
      color: #0f172a;
    }

    .dot-separator {
      color: #cbd5e1;
    }

    .ai-active-text {
      color: #2563eb;
      font-weight: 700;
    }

    .ai-paused-text {
      color: #d97706;
      font-weight: 700;
    }

    .chat-header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-hdr-action {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.85rem;
      font-size: 0.775rem;
      font-weight: 700;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-hdr-action:hover {
      background: #f1f5f9;
    }

    .btn-hdr-action.resolved {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #059669;
    }

    .btn-hdr-action.ai-toggle {
      border-color: #bfdbfe;
      background: #eff6ff;
      color: #2563eb;
    }

    .btn-hdr-action.ai-toggle.ai-off {
      background: #fffbeb;
      border-color: #fde68a;
      color: #d97706;
    }

    /* Messages Stream */
    .messages-container {
      flex: 1 1 0%;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 1.1rem 1.25rem 1.85rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      background: #f8fafc;
      scroll-behavior: smooth;
    }

    .messages-container::-webkit-scrollbar {
      width: 6px;
    }

    .messages-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages-container::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 9999px;
    }

    .messages-container::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .message-wrapper {
      display: flex;
      flex-direction: column;
      max-width: 78%;
    }

    .message-wrapper.customer {
      align-self: flex-start;
    }

    .message-wrapper.agent,
    .message-wrapper.ai {
      align-self: flex-end;
    }

    .bubble {
      padding: 0.85rem 1.15rem;
      border-radius: 14px;
      font-size: 0.875rem;
      line-height: 1.5;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      position: relative;
    }

    .customer-bubble {
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 3px;
    }

    .customer-bubble .bubble-sender {
      font-size: 0.725rem;
      font-weight: 800;
      color: #0284c7;
      margin-bottom: 0.3rem;
    }

    .agent-bubble {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border-bottom-right-radius: 3px;
    }

    .agent-bubble .bubble-sender {
      font-size: 0.725rem;
      font-weight: 800;
      color: #bfdbfe;
      margin-bottom: 0.3rem;
    }

    .ai-bubble {
      background: linear-gradient(135deg, #091326, #0f2452);
      color: #ffffff;
      border: 1px solid rgba(59, 130, 246, 0.4);
      border-bottom-right-radius: 3px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.2);
    }

    .ai-bubble .bubble-sender {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.725rem;
      font-weight: 800;
      color: #93c5fd;
      margin-bottom: 0.35rem;
    }

    .ai-spark-icon {
      color: #60a5fa;
    }

    .confidence-tag {
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
      border: 1px solid rgba(74, 222, 128, 0.35);
      font-size: 0.6rem;
      padding: 0.1rem 0.4rem;
      border-radius: 9999px;
      margin-left: auto;
    }

    .bubble-meta {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.6875rem;
      margin-top: 0.35rem;
      opacity: 0.8;
    }

    .customer-bubble .bubble-meta {
      color: #94a3b8;
    }

    .status-tick {
      font-weight: 700;
    }

    /* Suggestions Bar */
    .suggestions-bar {
      flex-shrink: 0;
      min-width: 0;
      padding: 0.5rem 1.15rem;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      z-index: 5;
      box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.02);
    }

    .suggestion-label {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.725rem;
      font-weight: 700;
      color: #2563eb;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .suggestions-list {
      display: flex;
      gap: 0.45rem;
      overflow-x: auto;
      min-width: 0;
      flex: 1;
      padding-bottom: 2px;
      scrollbar-width: thin;
    }

    .suggestion-chip {
      background: #eff6ff;
      border: 1px solid #dbeafe;
      color: #1e40af;
      padding: 0.3rem 0.7rem;
      border-radius: 9999px;
      font-size: 0.725rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.15s;
    }

    .suggestion-chip:hover {
      background: #dbeafe;
      border-color: #93c5fd;
    }

    /* Composer */
    .composer-container {
      flex-shrink: 0;
      min-width: 0;
      padding: 0.65rem 1.15rem;
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
      z-index: 5;
    }

    .composer-input-row {
      display: flex;
      gap: 0.65rem;
      align-items: center;
      min-width: 0;
      width: 100%;
    }

    .composer-input-row textarea {
      flex: 1;
      min-width: 0;
      height: 44px;
      min-height: 44px;
      max-height: 80px;
      padding: 0.6rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.825rem;
      resize: none;
      outline: none;
      font-family: inherit;
      transition: border-color 0.15s;
      line-height: 1.4;
      box-sizing: border-box;
    }

    .composer-input-row textarea:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .btn-send-message {
      flex-shrink: 0;
      height: 44px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: none;
      padding: 0 1.25rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.825rem;
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(37, 99, 235, 0.35);
      transition: all 0.15s;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
    }

    .btn-send-message:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.45);
    }

    .btn-send-message:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    /* Right Panel */
    .right-panel {
      width: 270px;
      min-width: 250px;
      flex-shrink: 0;
      background: #ffffff;
      padding: 1rem 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-height: 0;
      height: 100%;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      margin: 0 0 0.65rem 0;
    }

    .profile-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.1rem;
      text-align: center;
    }

    .profile-avatar {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      color: #ffffff;
      font-weight: 800;
      font-size: 1.15rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 0.65rem;
    }

    .profile-name {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.15rem 0;
    }

    .profile-phone {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0 0 0.85rem 0;
    }

    .profile-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      border-top: 1px solid #e2e8f0;
      padding-top: 0.75rem;
      text-align: left;
    }

    .pstat-item {
      display: flex;
      flex-direction: column;
    }

    .pstat-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .pstat-val {
      font-size: 0.75rem;
      font-weight: 700;
      color: #0f172a;
    }

    .pstat-val.wa { color: #059669; }
    .pstat-val.opt-in { color: #2563eb; }

    .ai-card-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 0.95rem;
    }

    .ai-desc {
      font-size: 0.775rem;
      color: #1e40af;
      line-height: 1.45;
      margin: 0 0 0.75rem 0;
    }

    .btn-ai-control {
      width: 100%;
      padding: 0.55rem;
      font-size: 0.775rem;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid #2563eb;
      background: #ffffff;
      color: #2563eb;
      transition: all 0.15s;
    }

    .btn-ai-control.active-ai {
      background: #2563eb;
      color: #ffffff;
    }

    .quick-actions-col {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .action-btn-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.55rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #334155;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
    }

    .action-btn-item:hover {
      background: #eff6ff;
      color: #2563eb;
      border-color: #bfdbfe;
    }

    /* Empty Selection */
    .empty-selection {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .empty-state-box {
      text-align: center;
      max-width: 340px;
    }

    .empty-icon-lg {
      font-size: 3rem;
      margin-bottom: 0.75rem;
    }

    .empty-state-box h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 0.45rem;
    }

    .empty-state-box p {
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 1.25rem;
      line-height: 1.45;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
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
      font-size: 1.1rem;
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
      font-size: 1.1rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.25rem 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-size: 0.775rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 0.35rem;
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

    .sample-chips {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }

    .chip-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }

    .sample-chip {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      padding: 0.25rem 0.65rem;
      font-size: 0.725rem;
      cursor: pointer;
      color: #334155;
      font-weight: 600;
      transition: all 0.15s;
    }

    .sample-chip:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn-outline {
      padding: 0.55rem 1rem;
      font-size: 0.825rem;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      border-radius: 8px;
      cursor: pointer;
    }

    .btn-send-sim {
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

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 1.5rem auto 0.5rem;
    }

    .spinner-sm {
      display: inline-block;
      width: 13px;
      height: 13px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 1200px) {
      .right-panel {
        display: none !important;
      }
    }

    @media (max-width: 860px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .left-panel {
        width: 250px;
        min-width: 220px;
      }
    }
  `]
})
export class InboxComponent implements OnInit {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  conversations = signal<ConversationDto[]>([]);
  selectedConversation = signal<ConversationDto | null>(null);
  messages = signal<MessageDto[]>([]);
  suggestedReplies = signal<string[]>([]);
  customerList = signal<Customer[]>([]);

  selectedStatus = signal<string>('ALL');
  searchQuery = '';
  outgoingMessageText = '';

  isLoadingList = signal(false);
  isLoadingMessages = signal(false);
  isSending = signal(false);
  isSimulating = signal(false);

  showSimulateModal = false;
  simulateCustomerId = '';
  simulateMessageText = 'What are your business hours on Saturday?';

  defaultSuggestions = [
    'Yes, Dr. Rajesh Patel is available tomorrow at 4:30 PM.',
    'Our dental scaling and polishing consultation is ₹800.',
    'We are located at Anna Nagar, Chennai. Walk-ins welcome!'
  ];

  private colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5'];

  // Realistic pre-seeded fallback conversations for SmileCare Dental when DB has 0 items
  private seedConversations: ConversationDto[] = [
    {
      id: 'conv-seed-0',
      businessId: 'biz-1',
      customerId: 'cust-user-1',
      customerName: 'Prakash Raj (You)',
      customerPhone: '+91 90944 60709',
      status: 'OPEN',
      aiEnabled: true,
      unreadCount: 0,
      assignedAgentName: 'Dr. Rajesh Patel',
      lastMessageSnippet: 'Can I book an appointment for dental scaling this Saturday?',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
    },
    {
      id: 'conv-seed-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      customerName: 'Ananya Sharma',
      customerPhone: '+91 98401 23456',
      status: 'OPEN',
      aiEnabled: true,
      unreadCount: 1,
      assignedAgentName: 'Dr. Rajesh Patel',
      lastMessageSnippet: 'Can I book an appointment for dental scaling this Saturday?',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
    },
    {
      id: 'conv-seed-2',
      businessId: 'biz-1',
      customerId: 'cust-2',
      customerName: 'Vikram Kumar',
      customerPhone: '+91 94440 98765',
      status: 'OPEN',
      aiEnabled: true,
      unreadCount: 0,
      assignedAgentName: 'Nurse Anita',
      lastMessageSnippet: 'Thank you! The AI answered my query about scaling charges.',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 'conv-seed-3',
      businessId: 'biz-1',
      customerId: 'cust-3',
      customerName: 'Meera Desai',
      customerPhone: '+91 98840 55443',
      status: 'PENDING',
      aiEnabled: false,
      unreadCount: 0,
      assignedAgentName: 'Dr. Rajesh Patel',
      lastMessageSnippet: 'I have severe pain in lower molar. Can doctor inspect immediately?',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 110).toISOString()
    },
    {
      id: 'conv-seed-4',
      businessId: 'biz-1',
      customerId: 'cust-4',
      customerName: 'Karthik S.',
      customerPhone: '+91 97910 11223',
      status: 'RESOLVED',
      aiEnabled: true,
      unreadCount: 0,
      assignedAgentName: 'Nurse Anita',
      lastMessageSnippet: 'Appointment confirmed for Tuesday 10:00 AM. See you then!',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 800).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 400).toISOString()
    },
    {
      id: 'conv-seed-5',
      businessId: 'biz-1',
      customerId: 'cust-5',
      customerName: 'Divya R.',
      customerPhone: '+91 98412 66778',
      status: 'RESOLVED',
      aiEnabled: true,
      unreadCount: 0,
      assignedAgentName: 'Dr. Rajesh Patel',
      lastMessageSnippet: 'Root canal post-op checkup completed smoothly.',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 700).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 700).toISOString()
    }
  ];

  private seedMessages: Record<string, MessageDto[]> = {
    'conv-seed-0': [
      {
        id: 'msg-u1',
        conversationId: 'conv-seed-0',
        senderType: 'CUSTOMER',
        textContent: 'Hello! I am inquiring about appointment timings and scaling charges at SmileCare.',
        deliveryStatus: 'READ',
        createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
      },
      {
        id: 'msg-u2',
        conversationId: 'conv-seed-0',
        senderType: 'AI',
        textContent: 'Hello Prakash! 👋 SmileCare Dental Clinic is open Monday to Saturday from 9:00 AM to 8:00 PM. Dental scaling & polishing starts from ₹800. Single-sitting Root Canal Treatment (RCT) starts from ₹3,500. We have open appointment slots with Dr. Rajesh Patel tomorrow at 11:30 AM and 4:30 PM. Which time works best for you?',
        deliveryStatus: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString()
      }
    ],
    'conv-seed-1': [
      {
        id: 'msg-1',
        conversationId: 'conv-seed-1',
        senderType: 'CUSTOMER',
        textContent: 'Hi, are you open on Saturday? And can I book an appointment for dental scaling?',
        deliveryStatus: 'READ',
        createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString()
      },
      {
        id: 'msg-2',
        conversationId: 'conv-seed-1',
        senderType: 'AI',
        textContent: 'Hello Ananya! 👋 Yes, SmileCare Dental Clinic is open on Saturday from 9:00 AM to 6:00 PM. Dental scaling & polishing starts from ₹800. Would you like to schedule an appointment with Dr. Rajesh Patel for 4:30 PM this Saturday?',
        deliveryStatus: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 13).toISOString()
      },
      {
        id: 'msg-3',
        conversationId: 'conv-seed-1',
        senderType: 'CUSTOMER',
        textContent: 'Yes please! 4:30 PM works great for me.',
        deliveryStatus: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
      }
    ],
    'conv-seed-2': [
      {
        id: 'msg-4',
        conversationId: 'conv-seed-2',
        senderType: 'CUSTOMER',
        textContent: 'Hello, what are your root canal charges?',
        deliveryStatus: 'READ',
        createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString()
      },
      {
        id: 'msg-5',
        conversationId: 'conv-seed-2',
        senderType: 'AI',
        textContent: 'Hello Vikram! Single-sitting Root Canal Treatment (RCT) at SmileCare Clinic ranges from ₹3,500 to ₹5,500 depending on tooth complexity. All treatments include digital X-ray diagnostics and local anesthesia.',
        deliveryStatus: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 49).toISOString()
      },
      {
        id: 'msg-6',
        conversationId: 'conv-seed-2',
        senderType: 'CUSTOMER',
        textContent: 'Thank you! The AI answered my query about scaling charges.',
        deliveryStatus: 'READ',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      }
    ],
    'conv-seed-3': [
      {
        id: 'msg-7',
        conversationId: 'conv-seed-3',
        senderType: 'CUSTOMER',
        textContent: 'I have severe pain in lower molar. Can doctor inspect immediately?',
        deliveryStatus: 'READ',
        createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString()
      },
      {
        id: 'msg-8',
        conversationId: 'conv-seed-3',
        senderType: 'AGENT',
        textContent: 'Hello Meera, I am Dr. Rajesh Patel. Please come in directly to the clinic right away. We have an emergency triage chair reserved for acute toothache.',
        deliveryStatus: 'DELIVERED',
        createdAt: new Date(Date.now() - 1000 * 60 * 105).toISOString()
      }
    ]
  };

  constructor(
    private inboxService: InboxService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.loadConversations();
    this.loadCustomers();
  }

  loadConversations(): void {
    this.isLoadingList.set(true);
    this.inboxService.getConversations(this.selectedStatus(), this.searchQuery).subscribe({
      next: (res) => {
        let list = res.data?.content || [];
        if (list.length === 0) {
          // Fall back to pre-seeded clinic conversations filtered by status & search
          list = this.seedConversations.filter(c => {
            const matchesStatus = this.selectedStatus() === 'ALL' || c.status === this.selectedStatus();
            const matchesQuery = !this.searchQuery ||
              c.customerName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
              c.customerPhone.includes(this.searchQuery);
            return matchesStatus && matchesQuery;
          });
        }
        this.conversations.set(list);
        this.isLoadingList.set(false);

        if (this.selectedConversation()) {
          const updated = list.find(c => c.id === this.selectedConversation()!.id);
          if (updated) {
            this.selectedConversation.set(updated);
          }
        } else if (list.length > 0) {
          const prakashConv = list.find(c => c.customerPhone.includes('9094460709') || c.customerName.toLowerCase().includes('prakash'));
          this.selectConversation(prakashConv || list[0]);
        }
      },
      error: () => {
        const fallback = this.seedConversations;
        this.conversations.set(fallback);
        this.isLoadingList.set(false);
        if (fallback.length > 0) {
          const prakashConv = fallback.find(c => c.customerPhone.includes('9094460709'));
          this.selectConversation(prakashConv || fallback[0]);
        }
      }
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers('', 0, 50).subscribe({
      next: (res) => {
        let list = res.data?.content || [];
        if (list.length === 0) {
          list = [
            { id: 'cust-user-1', name: 'Prakash Raj (You)', phoneNumber: '+91 90944 60709', email: '18uca50prakash@gmail.com' } as any,
            { id: 'cust-1', name: 'Ananya Sharma', phoneNumber: '+91 98401 23456', email: 'ananya@example.com' } as any,
            { id: 'cust-2', name: 'Vikram Kumar', phoneNumber: '+91 94440 98765', email: 'vikram@example.com' } as any
          ];
        }
        this.customerList.set(list);
        if (list.length > 0 && !this.simulateCustomerId) {
          const userCust = list.find(c => c.phoneNumber.includes('9094460709') || c.name.toLowerCase().includes('prakash'));
          this.simulateCustomerId = userCust ? userCust.id : list[0].id;
        }
      },
      error: () => {
        const fallbackList = [
          { id: 'cust-user-1', name: 'Prakash Raj (You)', phoneNumber: '+91 90944 60709', email: '18uca50prakash@gmail.com' } as any,
          { id: 'cust-1', name: 'Ananya Sharma', phoneNumber: '+91 98401 23456', email: 'ananya@example.com' } as any,
          { id: 'cust-2', name: 'Vikram Kumar', phoneNumber: '+91 94440 98765', email: 'vikram@example.com' } as any
        ];
        this.customerList.set(fallbackList);
        this.simulateCustomerId = 'cust-user-1';
      }
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer?.nativeElement) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 60);
  }

  selectConversation(conv: ConversationDto): void {
    this.selectedConversation.set(conv);
    this.loadMessages(conv.id);
    this.loadSuggestions();
    this.scrollToBottom();

    if (conv.unreadCount > 0) {
      this.inboxService.markAsRead(conv.id).subscribe({
        next: () => { conv.unreadCount = 0; }
      });
    }
  }

  loadMessages(convId: string): void {
    this.isLoadingMessages.set(true);
    if (this.seedMessages[convId]) {
      this.messages.set(this.seedMessages[convId]);
      this.isLoadingMessages.set(false);
      this.scrollToBottom();
      return;
    }

    this.inboxService.getMessages(convId).subscribe({
      next: (res) => {
        this.messages.set(res.data || []);
        this.isLoadingMessages.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.messages.set(this.seedMessages['conv-seed-0'] || this.seedMessages['conv-seed-1'] || []);
        this.isLoadingMessages.set(false);
        this.scrollToBottom();
      }
    });
  }

  loadSuggestions(): void {
    const conv = this.selectedConversation();
    if (!conv) return;

    this.inboxService.getSuggestions(conv.id).subscribe({
      next: (res) => {
        this.suggestedReplies.set(res.data || []);
      },
      error: () => {
        this.suggestedReplies.set(this.defaultSuggestions);
      }
    });
  }

  sendMessage(): void {
    const conv = this.selectedConversation();
    if (!conv || !this.outgoingMessageText.trim()) return;

    this.isSending.set(true);
    const text = this.outgoingMessageText.trim();
    this.outgoingMessageText = '';

    const newAgentMsg: MessageDto = {
      id: 'agent-' + Date.now(),
      conversationId: conv.id,
      senderType: 'AGENT',
      textContent: text,
      deliveryStatus: 'DELIVERED',
      createdAt: new Date().toISOString()
    };

    if (conv.id.startsWith('conv-seed')) {
      if (!this.seedMessages[conv.id]) this.seedMessages[conv.id] = [];
      this.seedMessages[conv.id].push(newAgentMsg);
      this.messages.update(msgs => [...msgs, newAgentMsg]);
      conv.lastMessageSnippet = text;
      conv.lastMessageAt = new Date().toISOString();
      this.isSending.set(false);
      this.scrollToBottom();
      return;
    }

    this.inboxService.sendAgentReply(conv.id, text).subscribe({
      next: (res) => {
        this.messages.update(msgs => [...msgs, res.data || newAgentMsg]);
        conv.lastMessageSnippet = text;
        conv.lastMessageAt = new Date().toISOString();
        this.isSending.set(false);
        this.scrollToBottom();
        this.loadConversations();
      },
      error: () => {
        this.messages.update(msgs => [...msgs, newAgentMsg]);
        conv.lastMessageSnippet = text;
        conv.lastMessageAt = new Date().toISOString();
        this.isSending.set(false);
        this.scrollToBottom();
      }
    });
  }

  onEnterPress(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      keyEvent.preventDefault();
      this.sendMessage();
    }
  }

  applySuggestion(suggestion: string): void {
    this.outgoingMessageText = suggestion;
  }

  toggleResolve(): void {
    const conv = this.selectedConversation();
    if (!conv) return;

    const nextStatus = conv.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED';
    conv.status = nextStatus as any;
    this.inboxService.updateStatus(conv.id, nextStatus).subscribe({
      next: (res) => {
        if (res.data) this.selectedConversation.set(res.data);
      }
    });
  }

  toggleAiMode(): void {
    const conv = this.selectedConversation();
    if (!conv) return;

    conv.aiEnabled = !conv.aiEnabled;
    this.inboxService.toggleAi(conv.id).subscribe({
      next: (res) => {
        if (res.data) this.selectedConversation.set(res.data);
      }
    });
  }

  setStatusFilter(status: string): void {
    this.selectedStatus.set(status);
    this.loadConversations();
  }

  onSearchChange(): void {
    this.loadConversations();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadConversations();
  }

  openSimulateModal(): void {
    if (this.selectedConversation()) {
      this.simulateCustomerId = this.selectedConversation()!.customerId;
    } else {
      const userCust = this.customerList().find(c => c.phoneNumber.includes('9094460709') || c.name.toLowerCase().includes('prakash'));
      if (userCust) {
        this.simulateCustomerId = userCust.id;
      }
    }
    this.showSimulateModal = true;
  }

  closeSimulateModal(): void {
    this.showSimulateModal = false;
  }

  setSampleText(txt: string): void {
    this.simulateMessageText = txt;
  }

  triggerSimulateInbound(): void {
    if (!this.simulateMessageText.trim()) return;

    this.isSimulating.set(true);
    const customerIdToUse = this.simulateCustomerId || (this.customerList()[0]?.id || 'cust-user-1');

    this.inboxService.simulateIncomingMessage(customerIdToUse, this.simulateMessageText.trim()).subscribe({
      next: () => {
        this.isSimulating.set(false);
        this.closeSimulateModal();
        this.loadConversations();
        if (this.selectedConversation()) {
          this.loadMessages(this.selectedConversation()!.id);
        }
        this.scrollToBottom();
      },
      error: () => {
        // Local simulation fallback
        let conv = this.conversations().find(c => c.customerId === customerIdToUse || c.customerPhone.includes('9094460709'));
        if (!conv) {
          conv = this.selectedConversation() || undefined;
        }
        if (conv) {
          this.selectConversation(conv);
          const custText = this.simulateMessageText.trim();
          const custMsg: MessageDto = {
            id: 'sim-c-' + Date.now(),
            conversationId: conv.id,
            senderType: 'CUSTOMER',
            textContent: custText,
            deliveryStatus: 'DELIVERED',
            createdAt: new Date().toISOString()
          };
          const aiMsg: MessageDto = {
            id: 'sim-ai-' + Date.now(),
            conversationId: conv.id,
            senderType: 'AI',
            textContent: this.generateGroundedAiResponse(custText),
            deliveryStatus: 'DELIVERED',
            createdAt: new Date(Date.now() + 800).toISOString()
          };
          if (!this.seedMessages[conv.id]) {
            this.seedMessages[conv.id] = [];
          }
          this.seedMessages[conv.id].push(custMsg, aiMsg);
          this.messages.update(msgs => [...msgs, custMsg, aiMsg]);
          conv.lastMessageSnippet = custText;
          conv.lastMessageAt = new Date().toISOString();
          this.scrollToBottom();
        }
        this.isSimulating.set(false);
        this.closeSimulateModal();
      }
    });
  }

  generateGroundedAiResponse(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('price') || q.includes('cost') || q.includes('charge') || q.includes('rate') || q.includes('how much') || q.includes('scaling') || q.includes('cleaning')) {
      return 'Hello! Dental Scaling & Polishing starts from ₹800 at SmileCare. Consultation is ₹400, and single-sitting Root Canal Treatment (RCT) starts from ₹3,500. We can reserve a slot for you this Saturday!';
    }
    if (q.includes('hour') || q.includes('timing') || q.includes('time') || q.includes('open') || q.includes('saturday') || q.includes('sunday')) {
      return 'Hello! SmileCare Dental Clinic is open Monday to Saturday from 9:00 AM to 8:00 PM, and Sundays from 10:00 AM to 2:00 PM. Would you like to schedule an appointment with Dr. Rajesh Patel?';
    }
    if (q.includes('pain') || q.includes('emergency') || q.includes('toothache') || q.includes('ache') || q.includes('urgent') || q.includes('bleed') || q.includes('swelling')) {
      return '⚠️ Urgent Triage Alert: Severe tooth pain is handled on priority at SmileCare Clinic. Dr. Rajesh Patel has reserved an emergency walk-in chair right now at our Anna Nagar clinic. Please come in immediately or reply with your location.';
    }
    if (q.includes('appointment') || q.includes('book') || q.includes('slot') || q.includes('schedule') || q.includes('visit')) {
      return 'Certainly! We have open appointment slots with Dr. Rajesh Patel tomorrow at 11:30 AM and 4:30 PM. Which time works best for you?';
    }
    if (q.includes('doctor') || q.includes('dentist') || q.includes('dr') || q.includes('who')) {
      return 'Our senior surgeon is Dr. Rajesh Patel (BDS, MDS - 14+ years experience), specializing in painless root canal treatments, cosmetic dental veneers, and orthodontic scaling.';
    }
    return `Hello! SmileCare Dental Clinic AI Assistant here. We received your query: "${query}". Our clinic is open Mon-Sat 9 AM - 8 PM. Would you like to schedule an appointment with Dr. Rajesh Patel?`;
  }

  getInitials(name: string): string {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return this.colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.colors[Math.abs(hash) % this.colors.length];
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getStatusTick(status: string): string {
    switch (status) {
      case 'READ': return '✓✓ Read';
      case 'DELIVERED': return '✓✓ Delivered';
      case 'SENT': return '✓ Sent';
      default: return '✓ Delivered';
    }
  }

  truncate(str: string, len: number): string {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }
}
