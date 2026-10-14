import { Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService, AssistantTurn } from '../../core/services/assistant.service';

interface ChatLine {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-assistant-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <aside
      class="assistant-panel"
      *ngIf="rendered()"
      [class.open]="assistant.panelOpen()"
      (animationend)="onPanelAnimationEnd($event)"
      role="dialog"
      aria-label="AI Assistant"
    >
      <header class="panel-header">
        <div>
          <p class="panel-kicker">Gemini</p>
          <h2>AI Assistant</h2>
        </div>
        <button type="button" class="close-btn" (click)="assistant.closePanel()" aria-label="Close assistant">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      <p class="key-banner" *ngIf="statusLoaded() && !configured()">
        Add <code>GEMINI_API_KEY</code> in the backend environment, then restart. The window is ready; Gemini is not connected yet.
      </p>

      <div class="messages" #messageList>
        <div class="empty" *ngIf="messages().length === 0">
          <p>Ask about this business. Gemini answers from the current workspace: FAQs, services, staff, and appointments.</p>
          <div class="suggestions">
            <button type="button" *ngFor="let prompt of suggestions" (click)="ask(prompt)">{{ prompt }}</button>
          </div>
        </div>

        <div class="bubble" *ngFor="let line of messages()" [class.user]="line.role === 'user'" [class.assistant]="line.role === 'assistant'">
          {{ line.text }}
        </div>

        <div class="bubble assistant pending" *ngIf="sending()">Thinking...</div>
      </div>

      <form class="composer" (ngSubmit)="send()">
        <input
          type="text"
          name="draft"
          [(ngModel)]="draft"
          placeholder="Ask SmartReply AI"
          [disabled]="sending()"
          autocomplete="off"
        />
        <button type="submit" [disabled]="sending() || !draft.trim()">Send</button>
      </form>
    </aside>
  `,
  styles: [`
    .assistant-panel {
      position: fixed;
      top: 64px;
      right: 16px;
      width: 360px;
      height: calc(100vh - 96px);
      z-index: 60;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: -8px 12px 32px rgba(15, 23, 42, 0.16);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: panel-out 0.22s ease forwards;
    }

    .assistant-panel.open {
      animation: panel-in 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }

    @keyframes panel-in {
      from {
        opacity: 0;
        transform: translateX(28px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes panel-out {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(28px);
      }
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0.9rem;
      background: #0b1329;
      color: #ffffff;
    }

    .panel-kicker {
      margin: 0;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #93c5fd;
    }

    .panel-header h2 {
      margin: 0.1rem 0 0;
      font-size: 1rem;
      font-weight: 800;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: #e2e8f0;
      width: 30px;
      height: 30px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.16);
    }

    .key-banner {
      margin: 0;
      padding: 0.7rem 1rem;
      background: #fff7ed;
      color: #9a3412;
      font-size: 0.78rem;
      line-height: 1.4;
      border-bottom: 1px solid #fed7aa;
    }

    .key-banner code {
      font-weight: 700;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      background: #f8fafc;
    }

    .empty {
      color: #64748b;
      font-size: 0.85rem;
      line-height: 1.45;
    }

    .empty p {
      margin: 0 0 0.75rem;
    }

    .suggestions {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .suggestions button {
      text-align: left;
      background: #ffffff;
      border: 1px solid #dbeafe;
      color: #1d4ed8;
      border-radius: 10px;
      padding: 0.55rem 0.7rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }

    .suggestions button:hover {
      background: #eff6ff;
    }

    .bubble {
      max-width: 88%;
      padding: 0.6rem 0.75rem;
      border-radius: 12px;
      font-size: 0.84rem;
      line-height: 1.45;
      white-space: pre-wrap;
    }

    .bubble.user {
      align-self: flex-end;
      background: #2563eb;
      color: #ffffff;
      border-bottom-right-radius: 4px;
    }

    .bubble.assistant {
      align-self: flex-start;
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
    }

    .bubble.pending {
      color: #64748b;
    }

    .composer {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
    }

    .composer input {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 0.6rem 0.75rem;
      font-size: 0.85rem;
      outline: none;
    }

    .composer input:focus {
      border-color: #2563eb;
    }

    .composer button {
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      padding: 0 0.9rem;
      font-weight: 700;
      cursor: pointer;
    }

    .composer button:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }
  `]
})
export class AssistantPanelComponent {
  readonly assistant = inject(AssistantService);

  @ViewChild('messageList') messageList?: ElementRef<HTMLDivElement>;

  readonly rendered = signal(false);
  readonly messages = signal<ChatLine[]>([]);
  readonly sending = signal(false);
  readonly configured = signal(true);
  readonly statusLoaded = signal(false);

  draft = '';
  readonly suggestions = [
    'What is your name?',
    'What can you do?',
    'How are you?'
  ];

  constructor() {
    effect(() => {
      const open = this.assistant.panelOpen();
      if (open) {
        this.clearCloseTimer();
        this.rendered.set(true);
        this.loadStatus();
        return;
      }
      if (this.rendered()) {
        this.closeTimer = setTimeout(() => {
          if (!this.assistant.panelOpen()) {
            this.rendered.set(false);
          }
        }, 240);
      }
    });
  }

  private closeTimer?: ReturnType<typeof setTimeout>;

  private clearCloseTimer(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
  }

  onPanelAnimationEnd(event: AnimationEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (!this.assistant.panelOpen() && event.animationName.includes('panel-out')) {
      this.rendered.set(false);
    }
  }

  ask(prompt: string): void {
    this.draft = prompt;
    this.send();
  }

  send(): void {
    const message = this.draft.trim();
    if (!message || this.sending()) {
      return;
    }

    const history: AssistantTurn[] = this.messages().map(line => ({ role: line.role, text: line.text }));
    this.messages.update(lines => [...lines, { role: 'user', text: message }]);
    this.draft = '';
    this.sending.set(true);
    this.scrollToEnd();

    this.assistant.chat(message, history).subscribe({
      next: (response) => {
        const reply = response.data?.reply || 'Gemini returned an empty reply.';
        this.messages.update(lines => [...lines, { role: 'assistant', text: reply }]);
        this.sending.set(false);
        this.scrollToEnd();
      },
      error: (error) => {
        const text = error?.error?.message || 'Could not reach Gemini.';
        this.messages.update(lines => [...lines, { role: 'assistant', text }]);
        this.sending.set(false);
        this.scrollToEnd();
      }
    });
  }

  private loadStatus(): void {
    this.assistant.status().subscribe({
      next: (response) => {
        this.configured.set(!!response.data?.configured);
        this.statusLoaded.set(true);
      },
      error: () => {
        this.configured.set(false);
        this.statusLoaded.set(true);
      }
    });
  }

  private scrollToEnd(): void {
    setTimeout(() => {
      const el = this.messageList?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
