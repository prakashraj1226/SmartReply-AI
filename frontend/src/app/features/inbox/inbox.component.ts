import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InboxService, ConversationDto, MessageDto } from '../../core/services/inbox.service';
import { CustomerService, Customer } from '../../core/services/customer.service';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inbox-container">
      <!-- LEFT PANEL: Conversation List -->
      <aside class="left-panel">
        <div class="panel-header">
          <div class="header-title-row">
            <h2>Inbox</h2>
            <button class="btn btn-sm btn-outline" (click)="openSimulateModal()">
              <span class="icon">⚡</span> Simulate
            </button>
          </div>

          <!-- Search & Filter -->
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search conversations..."
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
            />
            <button *ngIf="searchQuery" class="clear-btn" (click)="clearSearch()">✕</button>
          </div>

          <div class="filter-tabs">
            <button
              [class.active]="selectedStatus() === 'ALL'"
              (click)="setStatusFilter('ALL')">All</button>
            <button
              [class.active]="selectedStatus() === 'OPEN'"
              (click)="setStatusFilter('OPEN')">Open</button>
            <button
              [class.active]="selectedStatus() === 'PENDING'"
              (click)="setStatusFilter('PENDING')">Pending</button>
            <button
              [class.active]="selectedStatus() === 'RESOLVED'"
              (click)="setStatusFilter('RESOLVED')">Resolved</button>
          </div>
        </div>

        <!-- Conversations List -->
        <div class="conversations-scroll">
          <div *ngIf="isLoadingList()" class="loading-state">
            <div class="spinner"></div>
            <p>Loading conversations...</p>
          </div>

          <div *ngIf="!isLoadingList() && conversations().length === 0" class="empty-list">
            <div class="empty-icon">💬</div>
            <h4>No conversations found</h4>
            <p>Simulate an incoming WhatsApp message or add new customers to start chatting.</p>
            <button class="btn btn-sm btn-primary mt-2" (click)="openSimulateModal()">Simulate Inbound</button>
          </div>

          <div
            *ngFor="let conv of conversations()"
            class="conversation-item"
            [class.selected]="selectedConversation()?.id === conv.id"
            [class.unread]="conv.unreadCount > 0"
            (click)="selectConversation(conv)"
          >
            <div class="avatar" [ngStyle]="{'background-color': getAvatarColor(conv.customerName)}">
              {{ getInitials(conv.customerName) }}
            </div>

            <div class="conv-content">
              <div class="conv-top-row">
                <span class="customer-name">{{ conv.customerName }}</span>
                <span class="timestamp">{{ formatTime(conv.lastMessageAt || conv.createdAt) }}</span>
              </div>
              <div class="conv-snippet-row">
                <span class="snippet">{{ conv.lastMessageSnippet || 'No messages yet' }}</span>
                <span *ngIf="conv.unreadCount > 0" class="unread-badge">{{ conv.unreadCount }}</span>
              </div>
              <div class="conv-meta-row">
                <span class="status-pill" [attr.data-status]="conv.status">{{ conv.status }}</span>
                <span *ngIf="conv.aiEnabled" class="ai-badge">🤖 AI Active</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- MIDDLE PANEL: Messages Stream & Composer -->
      <main class="middle-panel" *ngIf="selectedConversation(); else noSelectionTpl">
        <!-- Chat Header -->
        <header class="chat-header">
          <div class="chat-header-info">
            <div class="avatar" [ngStyle]="{'background-color': getAvatarColor(selectedConversation()!.customerName)}">
              {{ getInitials(selectedConversation()!.customerName) }}
            </div>
            <div>
              <h3>{{ selectedConversation()!.customerName }}</h3>
              <div class="header-sub">
                <span class="phone-link">📱 {{ selectedConversation()!.customerPhone }}</span>
                <span class="status-indicator" [attr.data-status]="selectedConversation()!.status">
                  ● {{ selectedConversation()!.status }}
                </span>
                <span *ngIf="selectedConversation()!.aiEnabled" class="ai-pill">🤖 AI Assistant ON</span>
              </div>
            </div>
          </div>

          <div class="chat-header-actions">
            <button
              class="btn btn-sm"
              [class.btn-outline]="selectedConversation()!.status !== 'RESOLVED'"
              [class.btn-secondary]="selectedConversation()!.status === 'RESOLVED'"
              (click)="toggleResolve()"
            >
              {{ selectedConversation()!.status === 'RESOLVED' ? 'Reopen' : '✓ Resolve' }}
            </button>
            <button class="btn btn-sm btn-outline" (click)="toggleAiMode()">
              {{ selectedConversation()!.aiEnabled ? 'Pause AI' : 'Enable AI' }}
            </button>
          </div>
        </header>

        <!-- Message List -->
        <div class="messages-container" #messagesContainer>
          <div *ngIf="isLoadingMessages()" class="loading-state">
            <div class="spinner"></div>
            <p>Loading messages...</p>
          </div>

          <div *ngIf="!isLoadingMessages() && messages().length === 0" class="empty-messages">
            <p>No messages in this conversation yet. Send a message to start!</p>
          </div>

          <div *ngFor="let msg of messages()" class="message-wrapper" [ngClass]="msg.senderType.toLowerCase()">
            <!-- Customer Bubble -->
            <div *ngIf="msg.senderType === 'CUSTOMER'" class="bubble customer-bubble">
              <div class="bubble-sender">{{ selectedConversation()!.customerName }}</div>
              <div class="bubble-text">{{ msg.textContent }}</div>
              <div class="bubble-meta">
                <span>{{ formatTime(msg.createdAt) }}</span>
              </div>
            </div>

            <!-- Agent Bubble -->
            <div *ngIf="msg.senderType === 'AGENT'" class="bubble agent-bubble">
              <div class="bubble-sender">Staff Agent</div>
              <div class="bubble-text">{{ msg.textContent }}</div>
              <div class="bubble-meta">
                <span>{{ formatTime(msg.createdAt) }}</span>
                <span class="status-tick">{{ getStatusTick(msg.deliveryStatus) }}</span>
              </div>
            </div>

            <!-- AI Assistant Bubble -->
            <div *ngIf="msg.senderType === 'AI'" class="bubble ai-bubble">
              <div class="bubble-sender">
                <span class="ai-icon">✨</span> SmartReply AI (Auto-Reply)
              </div>
              <div class="bubble-text">{{ msg.textContent }}</div>
              <div class="bubble-meta">
                <span>{{ formatTime(msg.createdAt) }}</span>
                <span class="status-tick">✓ Delivered</span>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Suggestions Pill Bar -->
        <div class="suggestions-bar" *ngIf="suggestedReplies().length > 0">
          <div class="suggestion-label">
            <span>✨ AI Suggestions:</span>
          </div>
          <div class="suggestions-list">
            <button
              *ngFor="let suggestion of suggestedReplies()"
              class="suggestion-chip"
              (click)="applySuggestion(suggestion)"
            >
              {{ truncate(suggestion, 45) }}
            </button>
          </div>
        </div>

        <!-- Message Composer -->
        <footer class="composer-container">
          <div class="composer-input-row">
            <textarea
              [(ngModel)]="outgoingMessageText"
              placeholder="Type a reply as agent (Press Shift+Enter for new line)..."
              rows="2"
              (keydown.enter)="onEnterPress($event)"
            ></textarea>
            <button
              class="btn btn-primary send-btn"
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
            <p>Choose a customer from the left list or simulate an inbound WhatsApp message.</p>
            <button class="btn btn-primary" (click)="openSimulateModal()">⚡ Simulate Customer Inbound</button>
          </div>
        </main>
      </ng-template>

      <!-- RIGHT PANEL: Customer & Conversation Details -->
      <aside class="right-panel" *ngIf="selectedConversation()">
        <div class="panel-section">
          <h4>Customer Profile</h4>
          <div class="profile-card">
            <div class="profile-header">
              <div class="avatar-lg" [ngStyle]="{'background-color': getAvatarColor(selectedConversation()!.customerName)}">
                {{ getInitials(selectedConversation()!.customerName) }}
              </div>
              <div>
                <h5>{{ selectedConversation()!.customerName }}</h5>
                <p class="text-muted">{{ selectedConversation()!.customerPhone }}</p>
              </div>
            </div>

            <div class="info-rows">
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="status-pill" [attr.data-status]="selectedConversation()!.status">
                  {{ selectedConversation()!.status }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">AI Auto-Reply</span>
                <span class="badge" [class.badge-success]="selectedConversation()!.aiEnabled" [class.badge-warning]="!selectedConversation()!.aiEnabled">
                  {{ selectedConversation()!.aiEnabled ? 'Enabled' : 'Paused' }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Assigned Agent</span>
                <span>{{ selectedConversation()!.assignedAgentName || 'Unassigned' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Created At</span>
                <span>{{ formatFullDate(selectedConversation()!.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h4>AI Controls</h4>
          <div class="control-box">
            <p class="control-desc">
              When AI is active, inquiries matching your approved FAQs are answered instantly within seconds.
            </p>
            <button
              class="btn btn-block"
              [class.btn-warning]="selectedConversation()!.aiEnabled"
              [class.btn-primary]="!selectedConversation()!.aiEnabled"
              (click)="toggleAiMode()"
            >
              {{ selectedConversation()!.aiEnabled ? 'Pause AI Automation' : 'Activate AI Assistant' }}
            </button>
          </div>
        </div>

        <div class="panel-section">
          <h4>Quick Actions</h4>
          <div class="quick-actions">
            <button class="action-btn" (click)="loadSuggestions()">
              <span>✨</span> Refresh AI Suggestions
            </button>
            <button class="action-btn" (click)="openSimulateModal()">
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
          <h3>⚡ Simulate Incoming Customer Message</h3>
          <button class="close-btn" (click)="closeSimulateModal()">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">
            Simulate a customer texting your official WhatsApp Business number.
            If the AI Assistant is active, it will ground its reply in your approved Knowledge Base FAQs.
          </p>

          <div class="form-group">
            <label>Select Customer</label>
            <select [(ngModel)]="simulateCustomerId" class="form-control">
              <option *ngFor="let c of customerList()" [value]="c.id">
                {{ c.name }} ({{ c.phoneNumber }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Customer Message</label>
            <textarea
              [(ngModel)]="simulateMessageText"
              rows="3"
              class="form-control"
              placeholder="e.g. What are your opening hours? Or, How much is dental scaling?"
            ></textarea>
          </div>

          <div class="sample-chips">
            <span class="chip-label">Try sample:</span>
            <button class="chip" (click)="setSampleText('What are your business hours?')">Business hours</button>
            <button class="chip" (click)="setSampleText('How much do treatments cost?')">Pricing</button>
            <button class="chip" (click)="setSampleText('Do you handle emergency tooth pain?')">Emergency</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeSimulateModal()">Cancel</button>
          <button
            class="btn btn-primary"
            [disabled]="isSimulating() || !simulateCustomerId || !simulateMessageText.trim()"
            (click)="triggerSimulateInbound()"
          >
            <span *ngIf="!isSimulating()">Send Simulated WhatsApp</span>
            <span *ngIf="isSimulating()" class="spinner-sm"></span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inbox-container {
      display: flex;
      height: calc(100vh - 120px);
      background-color: var(--color-bg, #f8fafc);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      border: 1px solid var(--color-border, #e2e8f0);
    }

    /* LEFT PANEL */
    .left-panel {
      width: 320px;
      min-width: 280px;
      border-right: 1px solid var(--color-border, #e2e8f0);
      background: #ffffff;
      display: flex;
      flex-direction: column;
    }

    .panel-header {
      padding: 16px;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .header-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .header-title-row h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text, #0f172a);
      margin: 0;
    }

    .search-box {
      position: relative;
      margin-bottom: 12px;
    }

    .search-box input {
      width: 100%;
      padding: 8px 30px 8px 32px;
      border: 1px solid var(--color-border, #cbd5e1);
      border-radius: var(--radius-md, 8px);
      font-size: 0.875rem;
      box-sizing: border-box;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 8px;
      font-size: 0.85rem;
      color: #94a3b8;
    }

    .clear-btn {
      position: absolute;
      right: 8px;
      top: 8px;
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
    }

    .filter-tabs {
      display: flex;
      gap: 4px;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 6px;
    }

    .filter-tabs button {
      flex: 1;
      padding: 5px 8px;
      font-size: 0.75rem;
      font-weight: 600;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-tabs button.active {
      background: #ffffff;
      color: var(--color-primary, #2563eb);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .conversations-scroll {
      flex: 1;
      overflow-y: auto;
    }

    .conversation-item {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.15s;
    }

    .conversation-item:hover {
      background: #f8fafc;
    }

    .conversation-item.selected {
      background: #eff6ff;
      border-left: 3px solid var(--color-primary, #2563eb);
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .conv-content {
      flex: 1;
      min-width: 0;
    }

    .conv-top-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .customer-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .timestamp {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .conv-snippet-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .snippet {
      font-size: 0.8rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    .unread-badge {
      background: #ef4444;
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
    }

    .conv-meta-row {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .status-pill {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      background: #e2e8f0;
      color: #475569;
    }

    .status-pill[data-status="OPEN"] {
      background: #dcfce7;
      color: #166534;
    }

    .status-pill[data-status="PENDING"] {
      background: #fef9c3;
      color: #854d0e;
    }

    .status-pill[data-status="RESOLVED"] {
      background: #e0e7ff;
      color: #3730a3;
    }

    .ai-badge {
      font-size: 0.65rem;
      background: #f3e8ff;
      color: #7e22ce;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* MIDDLE PANEL */
    .middle-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border-right: 1px solid var(--color-border, #e2e8f0);
    }

    .chat-header {
      padding: 12px 20px;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }

    .chat-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chat-header-info h3 {
      margin: 0 0 2px 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .header-sub {
      display: flex;
      gap: 10px;
      font-size: 0.8rem;
      align-items: center;
    }

    .phone-link {
      color: #64748b;
    }

    .status-indicator {
      font-weight: 600;
    }

    .status-indicator[data-status="OPEN"] { color: #16a34a; }
    .status-indicator[data-status="PENDING"] { color: #ca8a04; }
    .status-indicator[data-status="RESOLVED"] { color: #4f46e5; }

    .ai-pill {
      background: #f3e8ff;
      color: #7e22ce;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .chat-header-actions {
      display: flex;
      gap: 8px;
    }

    .messages-container {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .message-wrapper {
      display: flex;
      width: 100%;
    }

    .message-wrapper.customer {
      justify-content: flex-start;
    }

    .message-wrapper.agent, .message-wrapper.ai {
      justify-content: flex-end;
    }

    .bubble {
      max-width: 70%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 0.9rem;
      line-height: 1.45;
      position: relative;
    }

    .customer-bubble {
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .agent-bubble {
      background: var(--color-primary, #2563eb);
      color: #ffffff;
      border-bottom-right-radius: 2px;
      box-shadow: 0 1px 3px rgba(37,99,235,0.2);
    }

    .ai-bubble {
      background: #7c3aed;
      color: #ffffff;
      border-bottom-right-radius: 2px;
      box-shadow: 0 2px 4px rgba(124,58,237,0.25);
    }

    .bubble-sender {
      font-size: 0.72rem;
      font-weight: 700;
      margin-bottom: 3px;
      opacity: 0.9;
    }

    .bubble-meta {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
      font-size: 0.7rem;
      margin-top: 4px;
      opacity: 0.8;
    }

    .status-tick {
      font-size: 0.75rem;
    }

    /* SUGGESTIONS BAR */
    .suggestions-bar {
      padding: 8px 16px;
      background: #faf5ff;
      border-top: 1px solid #f3e8ff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .suggestion-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #7e22ce;
      white-space: nowrap;
    }

    .suggestions-list {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .suggestion-chip {
      background: #ffffff;
      border: 1px solid #e9d5ff;
      color: #6b21a8;
      border-radius: 16px;
      padding: 4px 10px;
      font-size: 0.75rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .suggestion-chip:hover {
      background: #7e22ce;
      color: #ffffff;
      border-color: #7e22ce;
    }

    /* COMPOSER */
    .composer-container {
      padding: 12px 16px;
      background: #ffffff;
      border-top: 1px solid var(--color-border, #e2e8f0);
    }

    .composer-input-row {
      display: flex;
      gap: 10px;
      align-items: flex-end;
    }

    .composer-input-row textarea {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      font-family: inherit;
      resize: none;
      box-sizing: border-box;
    }

    .composer-input-row textarea:focus {
      outline: none;
      border-color: var(--color-primary, #2563eb);
    }

    .send-btn {
      height: 42px;
      padding: 0 18px;
      border-radius: 8px;
    }

    /* RIGHT PANEL */
    .right-panel {
      width: 280px;
      min-width: 240px;
      background: #ffffff;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-y: auto;
    }

    .panel-section h4 {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 10px 0;
    }

    .profile-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
    }

    .profile-header {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 12px;
    }

    .avatar-lg {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
    }

    .profile-header h5 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }

    .info-rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
    }

    .info-label {
      color: #64748b;
    }

    .control-box {
      background: #fdf4ff;
      border: 1px solid #f5d0fe;
      border-radius: 8px;
      padding: 12px;
    }

    .control-desc {
      font-size: 0.78rem;
      color: #86198f;
      margin: 0 0 10px 0;
      line-height: 1.4;
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #e2e8f0;
    }

    /* EMPTY STATES */
    .empty-selection {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-state-box {
      text-align: center;
      max-width: 320px;
    }

    .empty-icon-lg {
      font-size: 3rem;
      margin-bottom: 12px;
    }

    .empty-state-box h3 {
      font-size: 1.2rem;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .empty-state-box p {
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 16px;
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: 12px;
      width: 90%;
      max-width: 520px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #0f172a;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      color: #94a3b8;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-desc {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }

    .form-group {
      margin-bottom: 14px;
    }

    .form-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 5px;
      color: #334155;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.85rem;
      box-sizing: border-box;
      font-family: inherit;
    }

    .sample-chips {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 10px;
    }

    .chip-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .chip {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 3px 8px;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .chip:hover {
      background: #e2e8f0;
    }

    .modal-footer {
      padding: 14px 20px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #e2e8f0;
      border-top-color: var(--color-primary, #2563eb);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 8px;
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
export class InboxComponent implements OnInit {
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
  simulateMessageText = 'What are your business hours?';

  private colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5'];

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
        const list = res.data?.content || [];
        this.conversations.set(list);
        this.isLoadingList.set(false);

        // Keep selected conversation in sync if still present
        if (this.selectedConversation()) {
          const updated = list.find(c => c.id === this.selectedConversation()!.id);
          if (updated) {
            this.selectedConversation.set(updated);
          }
        } else if (list.length > 0) {
          this.selectConversation(list[0]);
        }
      },
      error: () => this.isLoadingList.set(false)
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers('', 0, 50).subscribe({
      next: (res) => {
        const list = res.data?.content || [];
        this.customerList.set(list);
        if (list.length > 0 && !this.simulateCustomerId) {
          this.simulateCustomerId = list[0].id;
        }
      }
    });
  }

  selectConversation(conv: ConversationDto): void {
    this.selectedConversation.set(conv);
    this.loadMessages(conv.id);
    this.loadSuggestions();

    if (conv.unreadCount > 0) {
      this.inboxService.markAsRead(conv.id).subscribe({
        next: () => {
          conv.unreadCount = 0;
        }
      });
    }
  }

  loadMessages(convId: string): void {
    this.isLoadingMessages.set(true);
    this.inboxService.getMessages(convId).subscribe({
      next: (res) => {
        this.messages.set(res.data || []);
        this.isLoadingMessages.set(false);
      },
      error: () => this.isLoadingMessages.set(false)
    });
  }

  loadSuggestions(): void {
    const conv = this.selectedConversation();
    if (!conv) return;

    this.inboxService.getSuggestions(conv.id).subscribe({
      next: (res) => {
        this.suggestedReplies.set(res.data || []);
      }
    });
  }

  sendMessage(): void {
    const conv = this.selectedConversation();
    if (!conv || !this.outgoingMessageText.trim()) return;

    this.isSending.set(true);
    const text = this.outgoingMessageText.trim();
    this.outgoingMessageText = '';

    this.inboxService.sendAgentReply(conv.id, text).subscribe({
      next: (res) => {
        this.messages.update(msgs => [...msgs, res.data]);
        this.isSending.set(false);
        this.loadConversations();
      },
      error: () => this.isSending.set(false)
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
    this.inboxService.updateStatus(conv.id, nextStatus).subscribe({
      next: (res) => {
        this.selectedConversation.set(res.data);
        this.loadConversations();
      }
    });
  }

  toggleAiMode(): void {
    const conv = this.selectedConversation();
    if (!conv) return;

    this.inboxService.toggleAi(conv.id).subscribe({
      next: (res) => {
        this.selectedConversation.set(res.data);
        this.loadConversations();
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

  // SIMULATE INBOUND
  openSimulateModal(): void {
    if (this.selectedConversation()) {
      this.simulateCustomerId = this.selectedConversation()!.customerId;
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
    if (!this.simulateCustomerId || !this.simulateMessageText.trim()) return;

    this.isSimulating.set(true);
    this.inboxService.simulateIncomingMessage(this.simulateCustomerId, this.simulateMessageText.trim()).subscribe({
      next: () => {
        this.isSimulating.set(false);
        this.closeSimulateModal();
        this.loadConversations();
        // If current conversation matches, reload messages to see both incoming and AI response
        if (this.selectedConversation() && this.selectedConversation()!.customerId === this.simulateCustomerId) {
          this.loadMessages(this.selectedConversation()!.id);
          this.loadSuggestions();
        }
      },
      error: () => this.isSimulating.set(false)
    });
  }

  // UTILITIES
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

  formatFullDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
  }

  getStatusTick(status: string): string {
    switch (status) {
      case 'READ': return '✓✓ Read';
      case 'DELIVERED': return '✓✓ Delivered';
      case 'SENT': return '✓ Sent';
      default: return '⏳';
    }
  }

  truncate(str: string, len: number): string {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }
}
