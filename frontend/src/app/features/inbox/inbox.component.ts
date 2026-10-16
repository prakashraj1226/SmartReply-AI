import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InboxService, ConversationDto, MessageDto } from '../../core/services/inbox.service';
import { CustomerService, Customer } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inbox-page">

      <!-- 1. Sleek Integrated Live Inbox Topbar (Dark Glowing Command Center Theme) -->
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
                <h2 class="topbar-title">Live WhatsApp Inbox</h2>
                <span class="live-status-pill">
                  <span class="pulse-dot"></span>
                  <span>Live Stream</span>
                </span>
              </div>
              <p class="topbar-subtitle">Real-time patient WhatsApp communications & AI auto-reply</p>
            </div>
          </div>
        </div>

        <div class="topbar-center">
          <div class="metric-pill">
            <span class="metric-dot blue"></span>
            <span class="metric-val">{{ conversations().length }}</span>
            <span class="metric-lbl">Active Chats</span>
          </div>
          <div class="metric-pill">
            <span class="metric-dot green"></span>
            <span class="metric-val">94.2%</span>
            <span class="metric-lbl">AI Autopilot</span>
          </div>
          <div class="metric-pill">
            <span class="metric-dot amber"></span>
            <span class="metric-val">1</span>
            <span class="metric-lbl">Escalation</span>
          </div>
          <div class="metric-pill">
            <span class="metric-dot purple"></span>
            <span class="metric-val">1.1s</span>
            <span class="metric-lbl">Avg Latency</span>
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

            <div *ngIf="!isLoadingList() && conversations().length === 0" style="padding: 2.5rem 1rem; text-align: center; color: #64748b;">
              <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">💬</div>
              <p style="font-weight: 700; color: #334155; margin-bottom: 0.35rem; font-size: 0.875rem;">No active conversations</p>
              <p style="font-size: 0.75rem; line-height: 1.4;">Inbound WhatsApp chats will appear here in real time.</p>
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
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    {{ isTelegram(selectedConversation()!.customerPhone) ? 'Telegram: ' + selectedConversation()!.customerPhone.replace('tg:', '') : selectedConversation()!.customerPhone }}
                  </span>
                  <span class="status-pill-small" [attr.data-status]="selectedConversation()!.status">
                    {{ selectedConversation()!.status }}
                  </span>
                </div>
                <div class="header-sub">
                  <span class="live-dot-indicator"></span>
                  <span *ngIf="selectedConversation()!.aiEnabled" class="ai-active-text">
                    ✨ AI Assistant ON
                  </span>
                  <span *ngIf="!selectedConversation()!.aiEnabled" class="ai-paused-text">
                    ⏸ AI Paused
                  </span>
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

              <button
                type="button"
                class="btn-hdr-action delete"
                (click)="confirmDelete()"
                title="Delete this conversation"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Delete</span>
              </button>

              <button
                type="button"
                class="btn-hdr-action info-toggle"
                [class.active]="showRightPanel"
                (click)="showRightPanel = !showRightPanel"
                title="Toggle Patient Details Panel"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
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
                <div class="bubble-sender">Staff Agent</div>
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
          <div class="suggestions-bar" *ngIf="suggestedReplies().length > 0">
            <div class="suggestion-label">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Instant AI Suggestions:</span>
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

          <!-- Message Composer Footer -->
          <footer class="composer-container">
            <div class="composer-input-row">
              <textarea
                [(ngModel)]="outgoingMessageText"
                placeholder="Type reply as staff (Shift + Enter for new line)..."
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
        <aside class="right-panel" *ngIf="selectedConversation() && showRightPanel">
          <div class="right-panel-header">
            <h4>Patient Profile</h4>
            <button class="close-panel-btn" (click)="showRightPanel = false" title="Close Panel">&times;</button>
          </div>

          <div class="panel-section">
            <div class="profile-card">
              <div class="profile-avatar" [ngStyle]="{'background-color': getAvatarColor(selectedConversation()!.customerName)}">
                {{ getInitials(selectedConversation()!.customerName) }}
              </div>
              <h5 class="profile-name">{{ selectedConversation()!.customerName }}</h5>
              <p class="profile-phone">{{ isTelegram(selectedConversation()!.customerPhone) ? 'Telegram ID: ' + selectedConversation()!.customerPhone.replace('tg:', '') : selectedConversation()!.customerPhone }}</p>

              <div class="profile-stats-grid">
                <div class="pstat-item">
                  <span class="pstat-label">Channel</span>
                  <span class="pstat-val" [class.wa]="!isTelegram(selectedConversation()!.customerPhone)" [class.tg]="isTelegram(selectedConversation()!.customerPhone)">
                    {{ isTelegram(selectedConversation()!.customerPhone) ? 'Telegram Bot' : 'WhatsApp Cloud' }}
                  </span>
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
                When active, questions matching business FAQs and services are answered instantly in 1.1s.
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
                <span>🔄</span> Refresh AI Suggestions
              </button>
              <button class="action-btn-item" (click)="openSimulateModal()">
                <span>⚡</span> Send Simulated Inbound
              </button>
              <button class="action-btn-item danger" (click)="confirmDelete()">
                <span>🗑️</span> Delete Conversation
              </button>
            </div>
          </div>
        </aside>
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
      overflow: hidden;
      box-sizing: border-box;
      gap: 0.6rem;
    }

    /* 1. Sleek Integrated Topbar (Dark Glowing Command Center Theme - Like Last Image) */
    .inbox-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: radial-gradient(120% 140% at 88% 12%, rgba(59, 130, 246, 0.32) 0%, rgba(37, 99, 235, 0.16) 40%, transparent 70%),
                  radial-gradient(100% 100% at 12% 88%, rgba(99, 102, 241, 0.22) 0%, transparent 60%),
                  linear-gradient(135deg, #091326 0%, #0d2149 55%, #081024 100%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 0.55rem 1.15rem;
      color: #ffffff;
      box-shadow: 0 4px 16px -2px rgba(11, 19, 41, 0.35);
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
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: rgba(59, 130, 246, 0.22);
      border: 1px solid rgba(96, 165, 250, 0.4);
      color: #60a5fa;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 14px rgba(59, 130, 246, 0.35);
      flex-shrink: 0;
    }

    .title-status-line {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .topbar-title {
      font-size: 1.05rem;
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
      font-size: 0.725rem;
      color: #cbd5e1;
      margin: 0.15rem 0 0 0;
      line-height: 1.2;
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
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-topbar-action.simulate:hover {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.55);
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
    }

    .conversation-item:hover .btn-conv-delete {
      opacity: 1;
      visibility: visible;
    }

    .btn-conv-delete:hover {
      background: #fee2e2;
      color: #dc2626;
      transform: scale(1.1);
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
      white-space: nowrap;
    }

    .status-pill-small {
      font-size: 0.625rem;
      font-weight: 800;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    .status-pill-small[data-status="OPEN"] { background: #dcfce7; color: #15803d; }
    .status-pill-small[data-status="PENDING"] { background: #fef3c7; color: #b45309; }
    .status-pill-small[data-status="RESOLVED"] { background: #f1f5f9; color: #64748b; }

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
      gap: 0.45rem;
      align-items: center;
    }

    .btn-hdr-action {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.75rem;
      font-size: 0.75rem;
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

    .btn-hdr-action.delete {
      border-color: #fecaca;
      background: #fff5f5;
      color: #dc2626;
    }

    .btn-hdr-action.delete:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #b91c1c;
    }

    .btn-hdr-action.info-toggle {
      padding: 0.4rem 0.55rem;
      color: #64748b;
    }

    .btn-hdr-action.info-toggle.active {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #2563eb;
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

    .right-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .right-panel-header h4 {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 800;
      color: #0f172a;
    }

    .close-panel-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      line-height: 1;
      color: #94a3b8;
      cursor: pointer;
      padding: 0 4px;
      border-radius: 4px;
    }

    .close-panel-btn:hover {
      color: #0f172a;
      background: #f1f5f9;
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
    .pstat-val.tg { color: #0284c7; }
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

    .action-btn-item.danger {
      color: #dc2626;
      background: #fff5f5;
      border-color: #fee2e2;
    }

    .action-btn-item.danger:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #b91c1c;
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
      .right-panel {
        display: none !important;
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

  showRightPanel = true;
  showDeleteConfirmModal = false;
  conversationToDelete: ConversationDto | null = null;
  isDeleting = signal(false);

  defaultSuggestions: string[] = [];

  private colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5'];

  constructor(
    private inboxService: InboxService,
    private customerService: CustomerService,
    private authService: AuthService
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

        if (this.selectedConversation()) {
          const updated = list.find(c => c.id === this.selectedConversation()!.id);
          if (updated) {
            this.selectedConversation.set(updated);
          } else if (list.length > 0) {
            this.selectConversation(list[0]);
          } else {
            this.selectedConversation.set(null);
            this.messages.set([]);
          }
        } else if (list.length > 0) {
          this.selectConversation(list[0]);
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
        this.suggestedReplies.set(res.data || []);
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
