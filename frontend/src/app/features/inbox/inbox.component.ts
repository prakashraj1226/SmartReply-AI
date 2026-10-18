import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InboxService, ConversationDto, MessageDto } from '../../core/services/inbox.service';
import { CustomerService, Customer } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { WhatsAppService } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inbox-page">

      <!-- Live Inbox title card (same app background; channel switcher) -->
      <div class="inbox-topbar">
        <div class="topbar-glow"></div>
        <div class="topbar-left">
          <div class="topbar-title-group">
            <div class="inbox-icon-badge">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div>
              <div class="title-status-line">
                <h2 class="topbar-title">Live Inbox</h2>
                <span class="live-status-pill">
                  <span class="pulse-dot"></span>
                  <span>LIVE</span>
                </span>
              </div>
              <p class="topbar-subtitle">WhatsApp & Telegram messages with AI auto-reply</p>
            </div>
          </div>
        </div>

        <div class="topbar-center">
          <div class="channel-switcher">
            <button type="button" [class.active]="selectedChannel() === 'ALL'" (click)="setChannelFilter('ALL')">All</button>
            <button type="button" [class.active]="selectedChannel() === 'WHATSAPP'" (click)="setChannelFilter('WHATSAPP')">WhatsApp</button>
            <button type="button" [class.active]="selectedChannel() === 'TELEGRAM'" (click)="setChannelFilter('TELEGRAM')">Telegram</button>
          </div>
          <div class="metric-pill">
            <span class="metric-dot blue"></span>
            <span class="metric-val">{{ filteredConversations().length }}</span>
            <span class="metric-lbl">Chats</span>
          </div>
        </div>

        <div class="topbar-right">
          <button type="button" class="btn-topbar-action simulate" (click)="openSimulateModal()">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>Simulate Inbound</span>
          </button>
        </div>
      </div>

      <div class="inbox-workspace-card">

        <!-- LEFT PANEL: Chat list -->
        <aside class="left-panel">
          <div class="panel-header">
            <div class="chats-title-row">
              <h2 class="chats-title">Chats</h2>
            </div>

            <div class="search-box">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search or start a new chat"
                [(ngModel)]="searchQuery"
                (input)="onSearchChange()"
              />
              <button *ngIf="searchQuery" class="clear-btn" (click)="clearSearch()">✕</button>
            </div>

            <div class="filter-tabs">
              <button [class.active]="selectedStatus() === 'ALL'" (click)="setStatusFilter('ALL')">All</button>
              <button [class.active]="selectedStatus() === 'PENDING'" (click)="setStatusFilter('PENDING')">Unread</button>
              <button [class.active]="selectedStatus() === 'OPEN'" (click)="setStatusFilter('OPEN')">Open</button>
              <button [class.active]="selectedStatus() === 'RESOLVED'" (click)="setStatusFilter('RESOLVED')">Resolved</button>
            </div>
          </div>

          <!-- Conversations Scroll List -->
          <div class="conversations-scroll">
            <div *ngIf="isLoadingList()" class="loading-state">
              <div class="spinner"></div>
              <p>Loading chats...</p>
            </div>

            <div *ngIf="!isLoadingList() && filteredConversations().length === 0" class="empty-chats">
              <div class="empty-chats-icon">💬</div>
              <p class="empty-chats-title">No chats found</p>
              <p class="empty-chats-sub">
                {{ selectedChannel() === 'TELEGRAM'
                  ? 'Telegram messages will appear here in real time.'
                  : selectedChannel() === 'WHATSAPP'
                    ? 'WhatsApp messages will appear here in real time.'
                    : 'WhatsApp & Telegram messages will appear here in real time.' }}
              </p>
            </div>

            <div
              *ngFor="let conv of filteredConversations()"
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
                  <span class="timestamp" [class.highlight]="conv.unreadCount > 0">{{ formatTime(conv.lastMessageAt || conv.createdAt) }}</span>
                </div>
                <div class="conv-snippet-row">
                  <div class="snippet-wrapper">
                    <span class="list-channel-tag" [class.tg]="isTelegramConversation(conv)">
                      {{ isTelegramConversation(conv) ? 'TG' : 'WA' }}
                    </span>
                    <span class="wa-double-check" *ngIf="conv.lastMessageSnippet">
                      <svg viewBox="0 0 16 11" width="15" height="11" fill="none">
                        <path d="M11.05 1.5L5.75 6.8L3.95 5" stroke="#8696a0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14.05 1.5L8.75 6.8" stroke="#8696a0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <span class="snippet">{{ conv.lastMessageSnippet || 'No messages yet' }}</span>
                  </div>
                  <div class="conv-badges">
                    <span *ngIf="conv.unreadCount > 0" class="unread-pill">{{ conv.unreadCount }}</span>
                  </div>
                </div>
              </div>

              <!-- Quick Delete Button on Hover -->
              <button
                type="button"
                class="btn-conv-delete"
                title="Delete Conversation"
                (click)="confirmDelete(conv, $event)"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </aside>

        <!-- MIDDLE PANEL: Live WhatsApp Message Stream & Composer -->
        <main class="middle-panel" *ngIf="selectedConversation(); else noSelectionTpl">
          <header class="chat-header">
            <div class="chat-header-info">
              <div class="avatar-header" [ngStyle]="{'background-color': getAvatarColor(selectedConversation()!.customerName)}">
                {{ getInitials(selectedConversation()!.customerName) }}
              </div>
              <div class="header-titles">
                <div class="header-name-row">
                  <h3>{{ selectedConversation()!.customerName }}</h3>
                </div>
                <div class="header-sub">
                  <span class="live-dot-indicator"></span>
                  <span class="online-text">online</span>
                  <span class="sub-divider">•</span>
                  <span *ngIf="selectedConversation()!.aiEnabled" class="ai-status-active">✨ AI Autopilot ON</span>
                  <span *ngIf="!selectedConversation()!.aiEnabled" class="ai-status-paused">⏸ AI Paused</span>
                </div>
              </div>
            </div>

            <div class="chat-header-actions">
              <button
                type="button"
                class="btn-hdr-action ai-toggle"
                [class.ai-off]="!selectedConversation()!.aiEnabled"
                (click)="toggleAiMode()"
                title="Toggle AI Auto-Reply"
              >
                {{ selectedConversation()!.aiEnabled ? 'Pause AI' : 'Resume AI' }}
              </button>

              <button
                type="button"
                class="btn-hdr-action resolve"
                [class.resolved]="selectedConversation()!.status === 'RESOLVED'"
                (click)="toggleResolve()"
                title="Mark conversation resolved or reopen"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>{{ selectedConversation()!.status === 'RESOLVED' ? 'Reopen' : 'Resolve' }}</span>
              </button>
            </div>
          </header>

          <!-- Messages Container with WhatsApp Wallpaper & Tails -->
          <div class="messages-container" #messagesContainer>
            <div *ngIf="isLoadingMessages()" class="loading-state">
              <div class="spinner"></div>
              <p>Fetching WhatsApp messages...</p>
            </div>

            <!-- WhatsApp Centered Date Pill -->
            <div class="wa-date-divider" *ngIf="messages().length > 0">
              <span class="wa-date-badge">TODAY</span>
            </div>

            <div *ngFor="let msg of messages()" class="message-wrapper" [ngClass]="msg.senderType.toLowerCase()">

              <!-- Patient / Customer Bubble (White with Top-Left Tail) -->
              <div *ngIf="msg.senderType === 'CUSTOMER'" class="bubble customer-bubble">
                <span class="wa-tail-left">
                  <svg viewBox="0 0 8 13" width="8" height="13">
                    <path d="M1.533 3.568L8 12.193V0H2.812C1.042 0 .474 1.156 1.533 3.568z" fill="#ffffff"/>
                  </svg>
                </span>
                <div class="bubble-sender">{{ selectedConversation()!.customerName }}</div>
                <div class="bubble-content-row">
                  <span class="bubble-text">{{ msg.textContent }}</span>
                  <span class="bubble-meta">
                    <span class="meta-time">{{ formatTime(msg.createdAt) }}</span>
                  </span>
                </div>
              </div>

              <!-- Human Staff Agent Bubble (Light Green with Top-Right Tail) -->
              <div *ngIf="msg.senderType === 'AGENT'" class="bubble agent-bubble">
                <span class="wa-tail-right">
                  <svg viewBox="0 0 8 13" width="8" height="13">
                    <path d="M6.467 3.568L0 12.193V0h5.188C6.958 0 7.526 1.156 6.467 3.568z" fill="#d9fdd3"/>
                  </svg>
                </span>
                <div class="bubble-sender staff">Staff Agent</div>
                <div class="bubble-content-row">
                  <span class="bubble-text">{{ msg.textContent }}</span>
                  <span class="bubble-meta">
                    <span class="meta-time">{{ formatTime(msg.createdAt) }}</span>
                    <span class="wa-status-double-ticks">
                      <svg viewBox="0 0 16 11" width="16" height="11" fill="none">
                        <path d="M11.05 1.5L5.75 6.8L3.95 5" stroke="#53bdeb" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14.05 1.5L8.75 6.8" stroke="#53bdeb" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                  </span>
                </div>
              </div>

              <!-- AI Auto-Reply Bubble (WhatsApp Light Green, Top-Right Tail, AI Tag) -->
              <div *ngIf="msg.senderType === 'AI'" class="bubble ai-bubble">
                <span class="wa-tail-right">
                  <svg viewBox="0 0 8 13" width="8" height="13">
                    <path d="M6.467 3.568L0 12.193V0h5.188C6.958 0 7.526 1.156 6.467 3.568z" fill="#d9fdd3"/>
                  </svg>
                </span>
                <div class="bubble-sender ai">
                  <span class="ai-spark">✨</span>
                  <span class="ai-title">SmartReply AI</span>
                  <span class="ai-grounded-pill">98% Grounded</span>
                </div>
                <div class="bubble-content-row">
                  <span class="bubble-text">{{ msg.textContent }}</span>
                  <span class="bubble-meta">
                    <span class="meta-time">{{ formatTime(msg.createdAt) }}</span>
                    <span class="wa-status-double-ticks">
                      <svg viewBox="0 0 16 11" width="16" height="11" fill="none">
                        <path d="M11.05 1.5L5.75 6.8L3.95 5" stroke="#53bdeb" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14.05 1.5L8.75 6.8" stroke="#53bdeb" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Single AI suggestion -->
          <div class="suggestions-bar" *ngIf="suggestedReplies().length > 0">
            <span class="suggestion-label">✨ Suggestion</span>
            <button
              type="button"
              class="suggestion-chip"
              (click)="applySuggestion(suggestedReplies()[0])"
              [title]="suggestedReplies()[0]"
            >
              {{ truncate(suggestedReplies()[0], 72) }}
            </button>
          </div>

          <!-- WhatsApp Message Composer Footer -->
          <footer class="composer-container">
            <div class="composer-row">
              <!-- Attachment Plus Button -->
              <button type="button" class="btn-composer-icon" title="Attach file or photo">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>

              <button type="button" class="btn-composer-icon" title="Emoji">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </button>

              <!-- WhatsApp Capsule White Input -->
              <div class="composer-input-pill">
                <textarea
                  [(ngModel)]="outgoingMessageText"
                  placeholder="Type a message"
                  rows="1"
                  (keydown.enter)="onEnterPress($event)"
                ></textarea>
              </div>

              <!-- Send Button (When text is entered) or Mic Button (When empty) -->
              <button
                *ngIf="outgoingMessageText.trim()"
                type="button"
                class="btn-wa-send"
                [disabled]="isSending()"
                (click)="sendMessage()"
                title="Send message"
              >
                <svg *ngIf="!isSending()" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
                <span *ngIf="isSending()" class="wa-send-spinner"></span>
              </button>

              <button
                *ngIf="!outgoingMessageText.trim()"
                type="button"
                class="btn-composer-icon mic-btn"
                title="Voice message"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>
            </div>
          </footer>
        </main>

        <ng-template #noSelectionTpl>
          <main class="middle-panel empty-selection">
            <div class="empty-state-box">
              <div class="wa-web-icon">
                <svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#94a3b8" stroke-width="1.3">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </div>
              <h2 class="wa-web-title">SmartReply WhatsApp Live Inbox</h2>
              <p class="wa-web-desc">Send and receive patient messages with AI Autopilot without keeping your phone online.<br/>Real-time Meta Cloud API webhook integration with intelligent FAQs grounding.</p>
              <button class="btn-wa-simulate" (click)="openSimulateModal()">⚡ Simulate Customer Inbound</button>
              <div class="wa-web-security">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>End-to-end encrypted with Meta Cloud API</span>
              </div>
            </div>
          </main>
        </ng-template>
      </div>

      <!-- SIMULATE INCOMING MODAL -->
      <div *ngIf="showSimulateModal" class="modal-backdrop" (click)="closeSimulateModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-box">
              <div class="modal-icon-badge">⚡</div>
              <div>
                <h3>Simulate Incoming WhatsApp Message</h3>
                <p class="modal-subtitle">Tests the Meta webhook and AI FAQ grounding engine in real time</p>
              </div>
            </div>
            <button class="close-btn" (click)="closeSimulateModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Select Patient</label>
              <select [(ngModel)]="simulateCustomerId" class="form-control">
                <option value="">Demo WhatsApp (+91 90944 60709)</option>
                <option *ngFor="let c of customerList()" [value]="c.id">
                  {{ c.name }} ({{ c.phoneNumber }})
                </option>
              </select>
              <p class="modal-subtitle" style="margin-top:8px" *ngIf="customerList().length === 0">
                No saved customers yet — demo number will be created automatically.
              </p>
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
              <button class="sample-chip" (click)="setSampleText('What are your services and pricing?')">Pricing Inquiry</button>
              <button class="sample-chip" (click)="setSampleText('I need urgent customer support right away!')">Urgent Support</button>
              <button class="sample-chip" (click)="setSampleText('Can I book an appointment tomorrow at 4:30 PM?')">Book Slot</button>
              <button class="sample-chip" (click)="setSampleText('Can I speak with a human support agent?')">Human Handoff</button>
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

      <!-- DELETE CONFIRMATION MODAL -->
      <div *ngIf="showDeleteConfirmModal" class="modal-backdrop" (click)="cancelDelete()">
        <div class="modal-dialog delete-modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-box">
              <div class="modal-icon-badge danger">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </div>
              <div>
                <h3>Delete Conversation</h3>
                <p class="modal-subtitle">Permanent removal of conversation thread</p>
              </div>
            </div>
            <button class="close-btn" (click)="cancelDelete()">&times;</button>
          </div>

          <div class="modal-body">
            <p style="margin: 0; color: #1e293b; font-size: 0.9rem; line-height: 1.5;">
              Are you sure you want to delete the conversation with
              <strong>{{ conversationToDelete?.customerName || conversationToDelete?.customerPhone }}</strong>?
            </p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 0.75rem 0.9rem; display: flex; gap: 0.5rem; align-items: flex-start; margin-top: 0.5rem;">
              <span style="font-size: 1rem;">⚠️</span>
              <span style="font-size: 0.8rem; color: #991b1b; line-height: 1.4;">
                All messages, notes, and records in this WhatsApp chat will be permanently deleted. This action cannot be undone.
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="cancelDelete()">Cancel</button>
            <button
              type="button"
              class="btn-delete-confirm"
              [disabled]="isDeleting()"
              (click)="executeDelete()"
            >
              {{ isDeleting() ? 'Deleting...' : 'Delete Conversation' }}
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
      min-height: 0;
      overflow: hidden;
      box-sizing: border-box;
      gap: 0.35rem;
    }

    /* Live Inbox title card — same navy/blue as Dashboard & other pages */
    .inbox-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      background: radial-gradient(120% 140% at 88% 12%, rgba(59, 130, 246, 0.32) 0%, rgba(37, 99, 235, 0.16) 40%, transparent 70%),
                  radial-gradient(100% 100% at 12% 88%, rgba(99, 102, 241, 0.22) 0%, transparent 60%),
                  linear-gradient(135deg, #091326 0%, #0d2149 55%, #081024 100%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 0.28rem 0.7rem;
      color: #ffffff;
      box-shadow: 0 2px 10px -2px rgba(11, 19, 41, 0.4);
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .inbox-topbar::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
      background-size: 16px 16px;
      opacity: 0.35;
      pointer-events: none;
    }

    .topbar-glow {
      position: absolute;
      top: -40px;
      right: -30px;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      filter: blur(12px);
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
      position: relative;
      z-index: 2;
    }

    .topbar-title-group {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .inbox-icon-badge {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: rgba(59, 130, 246, 0.22);
      border: 1px solid rgba(96, 165, 250, 0.4);
      color: #93c5fd;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 14px rgba(59, 130, 246, 0.3);
      flex-shrink: 0;
    }

    .title-status-line {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .topbar-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #ffffff !important;
      letter-spacing: -0.02em;
      margin: 0;
      line-height: 1.2;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    }

    .live-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(34, 197, 94, 0.16);
      border: 1px solid rgba(74, 222, 128, 0.38);
      color: #4ade80;
      font-size: 0.625rem;
      font-weight: 800;
      padding: 0.15rem 0.55rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      backdrop-filter: blur(8px);
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

    .topbar-subtitle {
      font-size: 0.68rem;
      color: #cbd5e1;
      margin: 0.05rem 0 0 0;
      line-height: 1.15;
    }

    .topbar-center {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      position: relative;
      z-index: 2;
    }

    .metric-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 8px;
      padding: 0.35rem 0.65rem;
      font-size: 0.75rem;
      color: #f1f5f9;
      backdrop-filter: blur(8px);
      transition: all 0.15s ease;
    }

    .metric-pill:hover {
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(255, 255, 255, 0.25);
    }

    .metric-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .metric-dot.blue { background: #60a5fa; box-shadow: 0 0 6px #60a5fa; }
    .metric-dot.green { background: #4ade80; box-shadow: 0 0 6px #4ade80; }
    .metric-dot.amber { background: #fbbf24; box-shadow: 0 0 6px #fbbf24; }
    .metric-dot.purple { background: #c084fc; box-shadow: 0 0 6px #c084fc; }

    .metric-val {
      font-weight: 800;
      color: #ffffff;
    }

    .metric-lbl {
      color: #94a3b8;
      font-weight: 600;
      font-size: 0.7rem;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
      position: relative;
      z-index: 2;
    }

    .btn-topbar-action.simulate {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-topbar-action.simulate:hover {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.5);
    }

    .channel-switcher {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.16);
      margin-right: 0.35rem;
    }

    .channel-switcher button {
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.78);
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.35rem 0.7rem;
      border-radius: 9999px;
      cursor: pointer;
      white-space: nowrap;
    }

    .channel-switcher button.active {
      background: #ffffff;
      color: #0f172a;
    }

    /* Workspace card — same light card style as rest of app */
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

    .left-panel {
      width: 320px;
      min-width: 280px;
      max-width: 360px;
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
      padding: 0.55rem 0.75rem 0.5rem;
      border-bottom: 1px solid #f1f5f9;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .chats-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chats-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .search-box {
      position: relative;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: #94a3b8;
      pointer-events: none;
    }

    .search-box input {
      width: 100%;
      padding: 0.4rem 1.85rem 0.4rem 2.2rem;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #0f172a;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .search-box input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-box input::placeholder {
      color: #94a3b8;
      font-size: 0.85rem;
    }

    .clear-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #8696a0;
      cursor: pointer;
      font-size: 0.75rem;
      padding: 2px;
    }

    .clear-btn:hover {
      color: #334155;
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
      white-space: nowrap;
    }

    .filter-tabs button:hover:not(.active) {
      color: #0f172a;
    }

    .filter-tabs button.active {
      background: #ffffff;
      color: #008069;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      font-weight: 700;
    }

    .list-channel-tag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 16px;
      padding: 0 4px;
      border-radius: 4px;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      background: #dcfce7;
      color: #166534;
      flex-shrink: 0;
    }

    .list-channel-tag.tg {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .conversations-scroll {
      flex: 1 1 0%;
      min-height: 0;
      overflow-y: auto;
      background: #ffffff;
    }

    .conversations-scroll::-webkit-scrollbar {
      width: 5px;
    }
    .conversations-scroll::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .empty-chats {
      padding: 3rem 1.5rem;
      text-align: center;
      color: #64748b;
    }

    .empty-chats-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .empty-chats-title {
      font-weight: 700;
      color: #334155;
      margin: 0 0 0.35rem;
      font-size: 0.95rem;
    }

    .empty-chats-sub {
      font-size: 0.8rem;
      line-height: 1.4;
      margin: 0;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.55rem 0.75rem;
      border-bottom: 1px solid #f8fafc;
      cursor: pointer;
      transition: background 0.15s ease;
      position: relative;
    }

    .conversation-item:hover {
      background: #f8fafc;
    }

    .conversation-item.selected {
      background: #eff6ff;
      border-left: 3px solid #2563eb;
    }

    .avatar-badge {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      color: #ffffff;
      font-weight: 600;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0.02em;
    }

    .conv-content {
      flex: 1;
      min-width: 0;
    }

    .conv-top-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.25rem;
    }

    .customer-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .timestamp {
      font-size: 0.75rem;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .timestamp.highlight {
      color: #25d366;
      font-weight: 600;
    }

    .conv-snippet-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .snippet-wrapper {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
      flex: 1;
    }

    .wa-double-check {
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
    }

    .snippet {
      font-size: 0.8rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conv-badges {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .unread-pill {
      background: #25d366;
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      min-width: 19px;
      height: 19px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      box-sizing: border-box;
    }

    .btn-conv-delete {
      opacity: 0;
      visibility: hidden;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 5px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s ease;
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
    }

    .conversation-item:hover .btn-conv-delete {
      opacity: 1;
      visibility: visible;
    }

    .btn-conv-delete:hover {
      background: #fee2e2;
      color: #dc2626;
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
      overflow: hidden;
      position: relative;
    }

    .chat-header {
      flex-shrink: 0;
      height: 48px;
      padding: 0 12px;
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
      gap: 12px;
      min-width: 0;
    }

    .avatar-header {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      color: #ffffff;
      font-weight: 600;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .header-titles {
      min-width: 0;
    }

    .header-name-row h3 {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.25;
    }

    .header-sub {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.775rem;
      color: #64748b;
      margin-top: 2px;
    }

    .live-dot-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #25d366;
    }

    .online-text {
      color: #008069;
      font-weight: 500;
    }

    .sub-divider {
      color: #8696a0;
      font-size: 0.65rem;
    }

    .ai-status-active {
      color: #008069;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .ai-status-paused {
      color: #d97706;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .chat-header-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-shrink: 0;
    }

    .btn-wa-header-icon {
      background: transparent;
      border: none;
      color: #54656f;
      cursor: pointer;
      padding: 7px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    .btn-wa-header-icon:hover,
    .btn-wa-header-icon.active {
      background: rgba(0, 0, 0, 0.06);
      color: #111b21;
    }

    .header-divider-v {
      width: 1px;
      height: 22px;
      background: #d1d7db;
      margin: 0 4px;
    }

    .btn-hdr-action {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 9999px;
      border: 1px solid #d1d7db;
      background: #ffffff;
      color: #54656f;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-hdr-action:hover {
      background: #f0f2f5;
      color: #111b21;
    }

    .btn-hdr-action.ai-toggle {
      background: #e7fce3;
      border-color: #00a884;
      color: #008069;
    }

    .btn-hdr-action.ai-toggle.ai-off {
      background: #fffbeb;
      border-color: #fde68a;
      color: #d97706;
    }

    .btn-hdr-action.resolve {
      background: #ffffff;
      border-color: #d1d7db;
      color: #54656f;
    }

    .btn-hdr-action.resolve.resolved {
      background: #e7fce3;
      border-color: #a7f3d0;
      color: #059669;
    }

    /* WhatsApp Messages Container */
    .messages-container {
      flex: 1 1 0%;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 14px 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      scroll-behavior: smooth;
    }

    .messages-container::-webkit-scrollbar {
      width: 6px;
    }

    .messages-container::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 9999px;
    }

    .wa-date-divider {
      display: flex;
      justify-content: center;
      margin: 6px 0 10px;
    }

    .wa-date-badge {
      background: #ffffff;
      color: #54656f;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 4px 12px;
      border-radius: 7.5px;
      box-shadow: 0 1px 0.5px rgba(11, 20, 26, 0.13);
      letter-spacing: 0.03em;
    }

    .message-wrapper {
      display: flex;
      flex-direction: column;
      max-width: 68%;
      position: relative;
    }

    .message-wrapper.customer {
      align-self: flex-start;
      margin-left: 8px;
    }

    .message-wrapper.agent,
    .message-wrapper.ai {
      align-self: flex-end;
      margin-right: 8px;
    }

    .bubble {
      padding: 6px 9px 8px 9px;
      border-radius: 7.5px;
      font-size: 0.885rem;
      line-height: 1.38;
      box-shadow: 0 1px 0.5px rgba(11, 20, 26, 0.13);
      position: relative;
      min-width: 90px;
    }

    /* Left White Customer Bubble */
    .customer-bubble {
      background: #ffffff;
      color: #111b21;
      border-top-left-radius: 0;
    }

    .wa-tail-left {
      position: absolute;
      top: 0;
      left: -8px;
      width: 8px;
      height: 13px;
    }

    .customer-bubble .bubble-sender {
      font-size: 0.78rem;
      font-weight: 600;
      color: #008069;
      margin-bottom: 2px;
    }

    /* Right Green Agent / AI Bubble */
    .agent-bubble,
    .ai-bubble {
      background: #d9fdd3;
      color: #111b21;
      border-top-right-radius: 0;
    }

    .wa-tail-right {
      position: absolute;
      top: 0;
      right: -8px;
      width: 8px;
      height: 13px;
    }

    .agent-bubble .bubble-sender.staff {
      font-size: 0.75rem;
      font-weight: 600;
      color: #008069;
      margin-bottom: 2px;
    }

    .ai-bubble .bubble-sender.ai {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #008069;
      margin-bottom: 3px;
    }

    .ai-spark {
      color: #008069;
    }

    .ai-grounded-pill {
      background: rgba(0, 168, 132, 0.15);
      color: #008069;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 6px;
    }

    .bubble-content-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 8px;
    }

    .bubble-text {
      color: #111b21;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .bubble-meta {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.6875rem;
      color: #667781;
      margin-left: auto;
      padding-top: 4px;
      flex-shrink: 0;
      float: right;
    }

    .wa-status-double-ticks {
      display: inline-flex;
      align-items: center;
    }

    /* Suggestions Bar */
    .suggestions-bar {
      flex-shrink: 0;
      min-width: 0;
      padding: 4px 10px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 5;
    }

    .suggestion-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #008069;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .suggestion-chip {
      background: #ffffff;
      border: 1px solid #d1d7db;
      color: #111b21;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      max-width: 100%;
      flex: 1;
      text-align: left;
      box-shadow: none;
      transition: all 0.15s;
    }

    .suggestion-chip:hover {
      background: #e7fce3;
      border-color: #00a884;
      color: #008069;
    }

    .composer-container {
      flex-shrink: 0;
      min-width: 0;
      padding: 5px 10px 6px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      z-index: 5;
    }

    .composer-row {
      display: flex;
      gap: 4px;
      align-items: center;
      min-width: 0;
      width: 100%;
    }

    .btn-composer-icon {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, color 0.15s;
    }

    .btn-composer-icon:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .composer-input-pill {
      flex: 1;
      min-width: 0;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
      padding: 5px 12px;
      display: flex;
      align-items: center;
      box-shadow: none;
    }

    .composer-input-pill textarea {
      width: 100%;
      border: none;
      outline: none;
      resize: none;
      font-size: 0.85rem;
      color: #0f172a;
      background: transparent;
      line-height: 1.3;
      max-height: 72px;
      font-family: inherit;
      padding: 1px 0;
      box-sizing: border-box;
    }

    .composer-input-pill textarea::placeholder {
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .btn-wa-send {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #00a884;
      color: #ffffff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(0, 168, 132, 0.35);
      transition: all 0.15s ease;
    }

    .btn-wa-send:hover:not(:disabled) {
      background: #02906f;
      transform: scale(1.05);
    }

    .btn-wa-send:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .wa-send-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Right Panel: WhatsApp Contact Info Drawer */
    .right-panel {
      width: 320px;
      min-width: 290px;
      max-width: 360px;
      flex-shrink: 0;
      background: #111b21;
      border-left: 1px solid #2a3942;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
    }

    .right-panel-header {
      height: 60px;
      padding: 0 16px;
      background: #202c33;
      border-bottom: 1px solid #2a3942;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .right-panel-header h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #e9edef;
    }

    .close-panel-btn {
      background: transparent;
      border: none;
      font-size: 1.1rem;
      color: #aebac1;
      cursor: pointer;
      padding: 6px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    .close-panel-btn:hover {
      background: rgba(0,0,0,0.06);
      color: #111b21;
    }

    .panel-section {
      padding: 16px;
      border-bottom: 10px solid #f0f2f5;
    }

    .profile-hero-section {
      text-align: center;
      padding: 24px 16px 20px;
    }

    .profile-avatar-large {
      width: 82px;
      height: 82px;
      border-radius: 50%;
      color: #ffffff;
      font-weight: 600;
      font-size: 1.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .profile-name {
      font-size: 1.15rem;
      font-weight: 600;
      color: #111b21;
      margin: 0 0 4px 0;
    }

    .profile-phone {
      font-size: 0.85rem;
      color: #667781;
      margin: 0 0 12px 0;
    }

    .channel-optin-strip {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }

    .channel-badge {
      font-size: 0.725rem;
      font-weight: 600;
      color: #008069;
      background: #e7fce3;
      padding: 3px 9px;
      border-radius: 9999px;
    }

    .channel-badge.tg {
      color: #0284c7;
      background: #e0f2fe;
    }

    .optin-badge {
      font-size: 0.725rem;
      font-weight: 600;
      color: #008069;
      background: #d9fdd3;
      padding: 3px 9px;
      border-radius: 9999px;
    }

    .section-title {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #54656f;
      margin: 0 0 10px 0;
    }

    .ai-card-info {
      background: #f0f2f5;
      border: 1px solid #e9edef;
      border-radius: 10px;
      padding: 12px;
    }

    .ai-desc {
      font-size: 0.8rem;
      color: #3b4a54;
      line-height: 1.45;
      margin: 0 0 10px 0;
    }

    .btn-ai-control {
      width: 100%;
      padding: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 9999px;
      cursor: pointer;
      border: 1px solid #00a884;
      background: #ffffff;
      color: #008069;
      transition: all 0.15s;
    }

    .btn-ai-control.active-ai {
      background: #00a884;
      color: #ffffff;
    }

    .quick-actions-col {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .action-btn-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      font-size: 0.825rem;
      font-weight: 500;
      color: #111b21;
      background: #f0f2f5;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
    }

    .action-btn-item:hover {
      background: #e9edef;
    }

    .action-btn-item.danger {
      color: #ea0038;
      background: #fff0f2;
    }

    .action-btn-item.danger:hover {
      background: #fde2e6;
    }

    .empty-selection {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #f8fafc !important;
      background-image: none !important;
      text-align: center;
    }

    .empty-state-box {
      max-width: 440px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .wa-web-icon {
      margin-bottom: 24px;
      opacity: 0.85;
    }

    .wa-web-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px 0;
    }

    .wa-web-desc {
      font-size: 0.875rem;
      color: #64748b;
      line-height: 1.5;
      margin: 0 0 20px 0;
    }

    .btn-wa-simulate {
      background: #00a884;
      color: #ffffff;
      border: none;
      padding: 9px 20px;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 168, 132, 0.35);
      transition: all 0.15s;
      margin-bottom: 28px;
    }

    .btn-wa-simulate:hover {
      background: #02906f;
      transform: translateY(-1px);
    }

    .wa-web-security {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      color: #94a3b8;
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

    .delete-modal-dialog {
      max-width: 440px;
    }

    .modal-icon-badge.danger {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .btn-delete-confirm {
      padding: 0.55rem 1.15rem;
      font-size: 0.825rem;
      font-weight: 700;
      border: none;
      background: #dc2626;
      color: #ffffff;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.35);
    }

    .btn-delete-confirm:hover:not(:disabled) {
      background: #b91c1c;
      transform: translateY(-1px);
    }

    .btn-delete-confirm:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-cancel {
      padding: 0.55rem 1rem;
      font-size: 0.825rem;
      font-weight: 600;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-cancel:hover {
      background: #f1f5f9;
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

    @media (max-width: 1100px) {
      .topbar-center {
        display: none;
      }
    }

    @media (max-width: 860px) {
      .left-panel {
        width: 250px;
        min-width: 220px;
      }
      .topbar-subtitle {
        display: none;
      }
    }
  `]
})
export class InboxComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  conversations = signal<ConversationDto[]>([]);
  selectedConversation = signal<ConversationDto | null>(null);
  messages = signal<MessageDto[]>([]);
  suggestedReplies = signal<string[]>([]);
  customerList = signal<Customer[]>([]);

  selectedStatus = signal<string>('ALL');
  selectedChannel = signal<'ALL' | 'WHATSAPP' | 'TELEGRAM'>('WHATSAPP');
  searchQuery = '';
  outgoingMessageText = '';

  filteredConversations = computed(() => {
    const channel = this.selectedChannel();
    const list = this.conversations();
    if (channel === 'ALL') return list;
    return list.filter(c => this.conversationChannel(c) === channel);
  });

  isLoadingList = signal(false);
  isLoadingMessages = signal(false);
  isSending = signal(false);
  isSimulating = signal(false);

  showSimulateModal = false;
  simulateCustomerId = '';
  simulateMessageText = 'What are your business hours on Saturday?';

  showDeleteConfirmModal = false;
  conversationToDelete: ConversationDto | null = null;
  isDeleting = signal(false);

  defaultSuggestions: string[] = [];

  private colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5'];
  /** Quiet poll so phone / webhook messages appear without reload */
  private readonly livePollMs = 1000;
  private livePollTimer: ReturnType<typeof setInterval> | null = null;
  private isLiveRefreshing = false;

  constructor(
    private inboxService: InboxService,
    private customerService: CustomerService,
    private authService: AuthService,
    private whatsAppService: WhatsAppService
  ) {}

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');
  }

  ngOnInit(): void {
    this.loadConversations();
    this.loadCustomers();
    this.startLivePolling();
  }

  ngOnDestroy(): void {
    this.stopLivePolling();
  }

  private startLivePolling(): void {
    this.stopLivePolling();
    this.livePollTimer = setInterval(() => this.refreshLiveInbox(), this.livePollMs);
  }

  private stopLivePolling(): void {
    if (this.livePollTimer) {
      clearInterval(this.livePollTimer);
      this.livePollTimer = null;
    }
  }

  /** Silent refresh — no spinner, keeps selection, scrolls only on new messages */
  private refreshLiveInbox(): void {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (this.isLiveRefreshing || this.isSending() || this.isSimulating() || this.isDeleting()) return;
    if (this.showSimulateModal || this.showDeleteConfirmModal) return;

    this.isLiveRefreshing = true;
    this.inboxService.getConversations(this.selectedStatus(), this.searchQuery).subscribe({
      next: (res) => {
        const list = res.data?.content || [];
        this.conversations.set(list);

        const visible = this.filteredConversations();
        const currentId = this.selectedConversation()?.id;
        const stillVisible = currentId ? visible.find(c => c.id === currentId) : undefined;

        if (stillVisible) {
          this.selectedConversation.set(stillVisible);
          this.refreshMessagesQuiet(stillVisible.id);
        } else if (!currentId && visible.length > 0) {
          this.selectConversation(visible[0]);
          this.isLiveRefreshing = false;
        } else if (currentId && !stillVisible) {
          if (visible.length > 0) {
            this.selectConversation(visible[0]);
          } else {
            this.selectedConversation.set(null);
            this.messages.set([]);
          }
          this.isLiveRefreshing = false;
        } else {
          this.isLiveRefreshing = false;
        }
      },
      error: () => {
        this.isLiveRefreshing = false;
      }
    });
  }

  private refreshMessagesQuiet(convId: string): void {
    this.inboxService.getMessages(convId).subscribe({
      next: (res) => {
        const next = res.data || [];
        const prev = this.messages();
        const lastPrev = prev.length ? prev[prev.length - 1]?.id : null;
        const lastNext = next.length ? next[next.length - 1]?.id : null;
        const grew = next.length > prev.length || (lastNext && lastNext !== lastPrev);

        this.messages.set(next);
        if (grew) {
          this.scrollToBottom();
          const last = next[next.length - 1];
          if (last?.senderType === 'CUSTOMER' || last?.senderType === 'AI') {
            this.loadSuggestions();
          }
        }
        this.isLiveRefreshing = false;
      },
      error: () => {
        this.isLiveRefreshing = false;
      }
    });
  }

  loadConversations(): void {
    this.isLoadingList.set(true);
    this.inboxService.getConversations(this.selectedStatus(), this.searchQuery).subscribe({
      next: (res) => {
        const list = res.data?.content || [];
        this.conversations.set(list);
        this.isLoadingList.set(false);

        const visible = this.filteredConversations();
        const currentId = this.selectedConversation()?.id;
        const stillVisible = currentId ? visible.find(c => c.id === currentId) : undefined;

        if (stillVisible) {
          this.selectedConversation.set(stillVisible);
        } else if (visible.length > 0) {
          this.selectConversation(visible[0]);
        } else {
          this.selectedConversation.set(null);
          this.messages.set([]);
        }
      },
      error: () => {
        this.conversations.set([]);
        this.isLoadingList.set(false);
        this.selectedConversation.set(null);
        this.messages.set([]);
      }
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
      },
      error: () => {
        this.customerList.set([]);
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
    this.inboxService.getMessages(convId).subscribe({
      next: (res) => {
        this.messages.set(res.data || []);
        this.isLoadingMessages.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.messages.set([]);
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
        const list = res.data || [];
        this.suggestedReplies.set(list.length ? [list[0]] : []);
      },
      error: () => {
        this.suggestedReplies.set([]);
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

  setChannelFilter(channel: 'ALL' | 'WHATSAPP' | 'TELEGRAM'): void {
    this.selectedChannel.set(channel);
    const visible = this.filteredConversations();
    const selected = this.selectedConversation();
    if (selected && !visible.some(c => c.id === selected.id)) {
      if (visible.length > 0) {
        this.selectConversation(visible[0]);
      } else {
        this.selectedConversation.set(null);
        this.messages.set([]);
      }
    }
  }

  conversationChannel(conv: ConversationDto): 'WHATSAPP' | 'TELEGRAM' {
    if ((conv.channel || '').toUpperCase() === 'TELEGRAM' || this.isTelegram(conv.customerPhone)) {
      return 'TELEGRAM';
    }
    return 'WHATSAPP';
  }

  isTelegramConversation(conv: ConversationDto): boolean {
    return this.conversationChannel(conv) === 'TELEGRAM';
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

  confirmDelete(conv?: ConversationDto, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.conversationToDelete = conv || this.selectedConversation();
    if (!this.conversationToDelete) return;
    this.showDeleteConfirmModal = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirmModal = false;
    this.conversationToDelete = null;
  }

  executeDelete(): void {
    const target = this.conversationToDelete;
    if (!target) return;

    this.isDeleting.set(true);
    const targetId = target.id;

    this.inboxService.deleteConversation(targetId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteConfirmModal = false;
        this.conversationToDelete = null;

        // Remove from conversation list signal
        const updated = this.conversations().filter(c => c.id !== targetId);
        this.conversations.set(updated);

        // If active conversation was deleted, select first available or clear
        if (this.selectedConversation()?.id === targetId) {
          if (updated.length > 0) {
            this.selectConversation(updated[0]);
          } else {
            this.selectedConversation.set(null);
            this.messages.set([]);
          }
        }
      },
      error: (err) => {
        console.error('Failed to delete conversation on server:', err);
        this.isDeleting.set(false);
        this.showDeleteConfirmModal = false;
        this.conversationToDelete = null;
        alert('Failed to delete conversation on server: ' + (err?.error?.message || err?.message || 'Please check backend logs.'));
      }
    });
  }

  setSampleText(txt: string): void {
    this.simulateMessageText = txt;
  }

  triggerSimulateInbound(): void {
    if (!this.simulateMessageText.trim()) return;

    this.isSimulating.set(true);
    const text = this.simulateMessageText.trim();
    const customerIdToUse = this.simulateCustomerId || '';

    const finishOk = () => {
      this.isSimulating.set(false);
      this.closeSimulateModal();
      this.loadCustomers();
      this.loadConversations();
      this.scrollToBottom();
    };

    const finishErr = (err: any) => {
      this.isSimulating.set(false);
      const status = err?.status;
      const serverMsg = typeof err?.error === 'string'
        ? err.error
        : (err?.error?.message || '');
      let msg = serverMsg || err?.message || 'Simulate failed. Check backend is running on :8081.';
      if (status === 401 || (status === 403 && !serverMsg)) {
        msg = 'Session expired or invalid login token. Please log out and log in again, then retry Simulate.';
      } else if (status === 403 && serverMsg) {
        msg = serverMsg;
      }
      alert(msg);
    };

    // Real customer UUID → conversation simulate API
    if (this.isUuid(customerIdToUse)) {
      this.inboxService.simulateIncomingMessage(customerIdToUse, text).subscribe({
        next: () => finishOk(),
        error: finishErr
      });
      return;
    }

    // No / invalid customer → WhatsApp webhook simulator (creates customer + chat)
    const selected = this.customerList().find(c => c.id === customerIdToUse);
    const phone = selected?.phoneNumber?.startsWith('tg:')
      ? '+919094460709'
      : (selected?.phoneNumber || '+919094460709');
    const name = selected?.name || 'Prakash Raj';

    this.whatsAppService.simulateWebhook(phone, text, name).subscribe({
      next: () => finishOk(),
      error: finishErr
    });
  }

  generateGroundedAiResponse(query: string): string {
    const bizName = this.authService.currentUser()?.businessName || 'our business';
    const q = query.toLowerCase();
    if (q.includes('price') || q.includes('cost') || q.includes('charge') || q.includes('rate') || q.includes('how much')) {
      return `Hello! Thanks for asking about our pricing at ${bizName}. Our rates depend on the service requested. Would you like us to share our catalog or connect you with a representative?`;
    }
    if (q.includes('hour') || q.includes('timing') || q.includes('time') || q.includes('open')) {
      return `Hello! ${bizName} is open Monday through Saturday from 9:00 AM to 7:00 PM. Would you like to schedule an appointment?`;
    }
    if (q.includes('appointment') || q.includes('book') || q.includes('slot') || q.includes('schedule') || q.includes('visit')) {
      return `Certainly! We have open appointment slots at ${bizName}. Which date and time works best for you?`;
    }
    return `Hello! Thank you for reaching out to ${bizName}. We received your query: "${query}". How can our team assist you further?`;
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

  isTelegram(phone: string | undefined): boolean {
    return !!phone && phone.startsWith('tg:');
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
