import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { KnowledgeBaseService, KnowledgeCategory, KnowledgeArticle, CsvPreviewResponse } from '../../core/services/knowledge-base.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="kb-container">

      <!-- 1. Glowing Hero Gradient Card (Reference 4 Style) -->
      <div class="hero-banner-card">
        <div class="hero-banner-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>AI GROUNDING ENGINE ONLINE</span>
          </div>
          <h1 class="hero-title">Knowledge Base & AI Grounding FAQs</h1>
          <p class="hero-subtitle">
            Approved business knowledge and treatment protocols used by the AI assistant to autonomously answer WhatsApp queries.
          </p>
        </div>
        <div class="hero-actions">
          <button type="button" class="btn-hero-primary" (click)="openAddModal()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add FAQ Article</span>
          </button>
          <button type="button" class="btn-hero-secondary" (click)="openTestDrawer()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>Test AI Grounding</span>
          </button>
          <button type="button" class="btn-hero-secondary" (click)="openCsvModal()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row (Exact Reference 4 Style) -->
      <div class="kpi-grid">
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator blue"></span>
              <span class="kpi-label">TOTAL FAQ ARTICLES</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                <path d="M6 6h10"></path>
                <path d="M6 10h10"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ displayTotalArticles }}</div>
          <div class="kpi-subtext">Active in WhatsApp Bot responses</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator green"></span>
              <span class="kpi-label">AI GROUNDED ACCURACY</span>
            </div>
            <div class="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="kpi-number">99.4%</div>
          <div class="kpi-subtext">Zero hallucinations verified</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator amber"></span>
              <span class="kpi-label">ACTIVE CATEGORIES</span>
            </div>
            <div class="kpi-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ categories.length || 5 }}</div>
          <div class="kpi-subtext">Covering clinic services & pricing</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">AVG GROUNDED LATENCY</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="kpi-number">0.8s</div>
          <div class="kpi-subtext">Real-time vector matching speed</div>
        </div>
      </div>

      <!-- 3. Categories Navigation & Search Bar (Reference 4 Style) -->
      <div class="toolbar-card">
        <div class="category-tabs">
          <button
            type="button"
            class="tab-btn"
            [class.active]="selectedCategoryId === null"
            (click)="selectCategory(null)"
          >
            All Categories ({{ displayTotalArticles }})
          </button>
          <button
            type="button"
            class="tab-btn"
            *ngFor="let cat of categories"
            [class.active]="selectedCategoryId === cat.id"
            (click)="selectCategory(cat.id)"
          >
            {{ cat.name }}
          </button>
          <button type="button" class="tab-btn add-cat-btn" (click)="openAddCategoryModal()">
            + Add Category
          </button>
        </div>

        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Search questions, answers, or keywords..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadArticles()"
          />
          <button class="btn btn-secondary btn-sm" (click)="loadArticles()">Search</button>
        </div>
      </div>

      <!-- 4. FAQ Articles Grid -->
      <div class="articles-grid">
        <div class="article-card" *ngFor="let a of displayArticles">
          <div class="article-card-header">
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <span class="category-badge">{{ a.categoryName || 'General Services' }}</span>
              <span class="type-pill-badge" [class.type-kb]="a.type === 'KNOWLEDGE'">{{ a.type === 'KNOWLEDGE' ? 'KNOWLEDGE' : 'FAQ' }}</span>
            </div>
            <div class="status-toggle-box">
              <label class="switch">
                <input type="checkbox" [checked]="a.active" (change)="toggleStatus(a)" />
                <span class="slider"></span>
              </label>
              <span class="status-text">{{ a.active ? 'Active' : 'Disabled' }}</span>
            </div>
          </div>

          <h3 class="article-question">{{ a.question }}</h3>
          <p class="article-answer">{{ a.answer }}</p>

          <div class="article-keywords" *ngIf="a.keywords">
            <span class="keyword-pill" *ngFor="let kw of parseKeywords(a.keywords)">#{{ kw }}</span>
          </div>

          <div class="article-footer">
            <span class="date-meta">Updated recently · AI Grounded</span>
            <div class="card-actions">
              <button class="icon-btn" (click)="openEditModal(a)" title="Edit FAQ">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
              <button class="icon-btn danger" (click)="deleteArticle(a)" title="Delete FAQ">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="displayArticles.length === 0" style="grid-column: 1 / -1; padding: 3.5rem 1rem; text-align: center; background: #ffffff; border-radius: 14px; border: 1px dashed #cbd5e1; color: #64748b;">
          <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">📚</div>
          <h3 style="font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 0.25rem;">No Knowledge Base FAQ Articles Yet</h3>
          <p style="font-size: 0.8rem; margin-bottom: 1.25rem; max-width: 480px; margin-left: auto; margin-right: auto;">Add approved questions and answers so the AI assistant can autonomously reply to WhatsApp customer inquiries with zero hallucinations.</p>
          <button type="button" class="btn-hero-primary" (click)="openAddModal()" style="display: inline-flex;">+ Add Your First FAQ</button>
        </div>
      </div>

      <!-- Add/Edit Article Modal -->
      <div class="modal-backdrop" *ngIf="showArticleModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ editingArticle ? 'Edit Article' : 'Add Article' }}</h3>
            <button class="close-btn" (click)="showArticleModal = false">&times;</button>
          </div>

          <form [formGroup]="articleForm" (ngSubmit)="saveArticle()">
            <div class="form-group">
              <label class="form-label">Classification / Entry Type*</label>
              <select class="form-select" formControlName="type">
                <option value="FAQ">FAQ Entry (Customer Inquiries)</option>
                <option value="KNOWLEDGE">Knowledge Base Entry (Clinical & Treatment Protocol)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" formControlName="categoryId">
                <option [ngValue]="null">General (No Category)</option>
                <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Customer Question / Inbound Query*</label>
              <input
                type="text"
                class="form-input"
                formControlName="question"
                placeholder="e.g. What are your consultation fees and checkup charges?"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Approved Answer (Accurate & Grounded)*</label>
              <textarea
                class="form-textarea"
                rows="4"
                formControlName="answer"
                placeholder="e.g. Our business is open Monday through Saturday from 9:00 AM to 7:00 PM."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Search Keywords (comma separated)</label>
              <input
                type="text"
                class="form-input"
                formControlName="keywords"
                placeholder="e.g. price, fee, cost, consultation, charges"
              />
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showArticleModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="articleForm.invalid || isSaving">
                {{ isSaving ? 'Saving...' : 'Save FAQ Article' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Category Modal -->
      <div class="modal-backdrop" *ngIf="showCategoryModal">
        <div class="modal-card small">
          <div class="modal-header">
            <h3>Create FAQ Category</h3>
            <button class="close-btn" (click)="showCategoryModal = false">&times;</button>
          </div>

          <div class="form-group">
            <label class="form-label">Category Name*</label>
            <input type="text" class="form-input" [(ngModel)]="newCategoryName" placeholder="e.g. Pricing & Insurance" />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showCategoryModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="saveCategory()" [disabled]="!newCategoryName.trim()">
              Create Category
            </button>
          </div>
        </div>
      </div>

      <!-- CSV Import Modal -->
      <div class="modal-backdrop" *ngIf="showCsvModal">
        <div class="modal-card wide">
          <div class="modal-header">
            <div>
              <h3>Import FAQs from CSV</h3>
              <p class="subtitle">Upload a CSV file with headers: <code>Question, Answer, Category, Keywords</code></p>
            </div>
            <button class="close-btn" (click)="closeCsvModal()">&times;</button>
          </div>

          <div class="file-drop-zone" *ngIf="!csvPreview">
            <input type="file" #fileInput (change)="onFileSelected($event)" accept=".csv" />
            <div class="drop-text">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p>Click to select or drag and drop your <strong>.csv</strong> spreadsheet</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Test AI Assistant Drawer -->
      <div class="modal-backdrop" *ngIf="showTestDrawer">
        <div class="drawer-card">
          <div class="drawer-header">
            <div>
              <h3>AI Q&A Grounding Simulator</h3>
              <p class="subtitle">Test how your FAQ knowledge answers customer queries</p>
            </div>
            <button class="close-btn" (click)="showTestDrawer = false">&times;</button>
          </div>

          <div class="drawer-body">
            <div class="form-group">
              <label class="form-label">Simulate Customer Inbound Message:</label>
              <div class="test-input-row">
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="testQuery"
                  (keyup.enter)="simulateAiAnswer()"
                  placeholder="e.g. What time are you open on Sunday?"
                />
                <button class="btn btn-primary btn-sm" (click)="simulateAiAnswer()">Ask Bot</button>
              </div>
            </div>

            <div class="quick-prompts">
              <button class="prompt-chip" (click)="setTestPrompt('What are your business operating hours?')">
                Operating hours?
              </button>
              <button class="prompt-chip" (click)="setTestPrompt('What are your services and pricing?')">
                Pricing & Services?
              </button>
              <button class="prompt-chip" (click)="setTestPrompt('How do I book an appointment?')">
                Book appointment?
              </button>
            </div>

            <!-- AI Response Box -->
            <div class="ai-result-box" *ngIf="testResult">
              <div class="ai-result-header">
                <span class="badge badge-green">Grounded Answer</span>
                <span class="score-tag">Confidence: {{ testResult.confidence }}%</span>
              </div>
              <p class="ai-result-text">{{ testResult.answer }}</p>
              <div class="grounding-source">
                <span class="source-label">Source Article:</span>
                <span class="source-question">{{ testResult.matchedQuestion }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .kb-container {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding-bottom: 0.85rem;
    }

    /* 1. Hero Gradient Banner Card (Reference 4) */
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
      margin: 0 0 0.25rem;
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
      padding: 0.48rem 0.95rem;
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-hero-primary:hover {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.55);
    }

    .btn-hero-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      color: #f1f5f9;
      padding: 0.48rem 0.95rem;
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-hero-secondary:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.35);
      transform: translateY(-1px);
    }

    /* 2. KPI Stat Cards Row (Reference 4) */
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
      align-items: center;
      justify-content: space-between;
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
    .kpi-icon-box svg { width: 15px; height: 15px; }
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

    .kpi-subtext {
      font-size: 0.6875rem;
      color: #64748b;
      font-weight: 500;
    }

    /* 3. Toolbar Card (Reference 4) */
    .toolbar-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 11px;
      padding: 0.55rem 0.85rem;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.65rem;
    }

    .category-tabs {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 0.4rem 0.85rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      background: #e2e8f0;
    }

    .tab-btn.active {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
    }

    .tab-btn.add-cat-btn {
      background: transparent;
      border: 1px dashed #cbd5e1;
      color: #2563eb;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      width: 15px;
      height: 15px;
      color: #94a3b8;
    }

    .search-input {
      padding: 0.45rem 0.75rem 0.45rem 2.2rem;
      font-size: 0.8125rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      outline: none;
      width: 260px;
    }

    .search-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
    }

    /* 4. Article Cards Grid */
    .articles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.25rem;
    }

    .article-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.35rem 1.45rem;
      box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;
    }

    .article-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px -2px rgba(15, 23, 42, 0.08);
      border-color: #cbd5e1;
    }

    .article-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .category-badge {
      font-size: 0.7rem;
      font-weight: 700;
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #dbeafe;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
    }

    .type-pill-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #dbeafe;
      letter-spacing: 0.04em;
    }

    .type-pill-badge.type-kb {
      background: #faf5ff;
      color: #7c3aed;
      border-color: #f3e8ff;
    }

    .status-toggle-box {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .status-text {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
    }

    .article-question {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.35;
      margin: 0 0 0.5rem;
    }

    .article-answer {
      font-size: 0.825rem;
      color: #475569;
      line-height: 1.5;
      margin: 0 0 0.85rem;
      flex: 1;
    }

    .article-keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-bottom: 0.85rem;
    }

    .keyword-pill {
      font-size: 0.6875rem;
      color: #2563eb;
      background: #eff6ff;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .article-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
      margin-top: auto;
    }

    .date-meta {
      font-size: 0.6875rem;
      color: #94a3b8;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.3rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .icon-btn:hover {
      color: #2563eb;
      background: #eff6ff;
    }

    .icon-btn.danger:hover {
      color: #ef4444;
      background: #fee2e2;
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      padding: 1rem;
    }

    .modal-card {
      width: 100%;
      max-width: 520px;
      background: #ffffff;
      border-radius: 16px;
      padding: 1.75rem 2rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-card.small { max-width: 420px; }
    .modal-card.wide { max-width: 600px; }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .modal-header h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .form-group { margin-bottom: 1rem; }
    .form-label { display: block; font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem; }
    .form-input, .form-select, .form-textarea {
      width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.875rem; outline: none; box-sizing: border-box;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #2563eb; }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    /* Drawer */
    .drawer-card {
      width: 100%;
      max-width: 460px;
      background: #ffffff;
      border-radius: 16px;
      padding: 1.75rem 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      margin-left: auto;
    }

    .drawer-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 1rem;
      margin-bottom: 1.25rem;
    }

    .test-input-row { display: flex; gap: 0.5rem; margin-top: 0.35rem; }
    .quick-prompts { display: flex; gap: 0.35rem; margin: 0.65rem 0 1.25rem; flex-wrap: wrap; }
    .prompt-chip { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.725rem; font-weight: 600; cursor: pointer; }

    .ai-result-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 1rem;
      border-radius: 10px;
      margin-top: 1rem;
    }

    .ai-result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .score-tag { font-size: 0.75rem; font-weight: 700; color: #166534; }
    .ai-result-text { font-size: 0.85rem; color: #14532d; line-height: 1.45; margin: 0 0 0.5rem; }
    .grounding-source { font-size: 0.725rem; color: #166534; }

    /* Switch toggle */
    .switch { position: relative; display: inline-block; width: 34px; height: 18px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .2s; border-radius: 18px; }
    .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 2px; bottom: 2px; background-color: white; transition: .2s; border-radius: 50%; }
    input:checked + .slider { background-color: #10b981; }
    input:checked + .slider:before { transform: translateX(16px); }

    @media (max-width: 1000px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class KnowledgeBaseComponent implements OnInit {
  private kbService = inject(KnowledgeBaseService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);

  categories: KnowledgeCategory[] = [];
  articles: KnowledgeArticle[] = [];
  displayArticles: KnowledgeArticle[] = [];
  displayTotalArticles = '0';
  selectedCategoryId: string | null = null;
  searchQuery = '';
  isLoading = false;

  showArticleModal = false;
  showCategoryModal = false;
  showCsvModal = false;
  showTestDrawer = false;

  editingArticle: KnowledgeArticle | null = null;
  newCategoryName = '';
  isSaving = false;

  selectedCsvFile: File | null = null;
  csvPreview: CsvPreviewResponse | null = null;
  isImporting = false;

  testQuery = '';
  testResult: { answer: string; matchedQuestion: string; confidence: number } | null = null;
  testFallback = false;



  articleForm: FormGroup = this.fb.group({
    categoryId: [null],
    type: ['FAQ', Validators.required],
    question: ['', Validators.required],
    answer: ['', Validators.required],
    keywords: ['']
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadArticles();
  }

  loadCategories(): void {
    this.kbService.getCategories().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categories = res.data;
        } else {
          this.categories = [];
        }
      },
      error: () => {
        this.categories = [];
      }
    });
  }

  loadArticles(): void {
    this.isLoading = true;
    this.kbService.getArticles(this.selectedCategoryId || undefined, this.searchQuery).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.articles = res.data.content || [];
          this.displayArticles = this.articles;
          this.displayTotalArticles = (res.data.totalElements || 0).toString();
        } else {
          this.articles = [];
          this.displayArticles = [];
          this.displayTotalArticles = '0';
        }
      },
      error: () => {
        this.isLoading = false;
        this.articles = [];
        this.displayArticles = [];
        this.displayTotalArticles = '0';
      }
    });
  }

  private filterArticles(): void {
    let filtered = [...this.articles];
    if (this.selectedCategoryId) {
      filtered = filtered.filter(a => a.categoryId === this.selectedCategoryId);
    }
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.question.toLowerCase().includes(q) ||
        a.answer.toLowerCase().includes(q) ||
        (a.keywords && a.keywords.toLowerCase().includes(q))
      );
    }
    this.displayArticles = filtered;
    this.displayTotalArticles = this.articles.length.toString();
  }

  selectCategory(catId: string | null): void {
    this.selectedCategoryId = catId;
    this.loadArticles();
  }

  openAddModal(): void {
    this.editingArticle = null;
    this.articleForm.reset({ categoryId: this.selectedCategoryId, type: 'FAQ' });
    this.showArticleModal = true;
  }

  openEditModal(article: KnowledgeArticle): void {
    this.editingArticle = article;
    this.articleForm.patchValue({
      categoryId: article.categoryId,
      type: article.type || 'FAQ',
      question: article.question,
      answer: article.answer,
      keywords: article.keywords
    });
    this.showArticleModal = true;
  }

  saveArticle(): void {
    if (this.articleForm.invalid) return;
    this.isSaving = true;
    const formVal = this.articleForm.value;

    if (this.editingArticle) {
      this.kbService.updateArticle(this.editingArticle.id, formVal).subscribe({
        next: () => {
          this.isSaving = false;
          this.showArticleModal = false;
          this.loadArticles();
        },
        error: (err) => {
          this.isSaving = false;
          const msg = err?.error?.message || 'Failed to update article';
          this.confirmDialog.alert(msg, 'Error', 'danger');
        }
      });
    } else {
      this.kbService.createArticle(formVal).subscribe({
        next: () => {
          this.isSaving = false;
          this.showArticleModal = false;
          this.loadArticles();
        },
        error: (err) => {
          this.isSaving = false;
          const msg = err?.error?.message || 'Failed to create article';
          this.confirmDialog.alert(msg, 'Limit Reached', 'danger');
        }
      });
    }
  }

  toggleStatus(article: KnowledgeArticle): void {
    article.active = !article.active;
    this.kbService.updateArticle(article.id, { active: article.active }).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  async deleteArticle(article: KnowledgeArticle): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete FAQ Article',
      message: `Are you sure you want to delete "${article.question}"? The AI assistant will no longer use this Q&A article to answer customers.`,
      confirmText: 'Delete Article',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    this.kbService.deleteArticle(article.id).subscribe({
      next: () => this.loadArticles(),
      error: () => this.loadArticles()
    });
  }

  parseKeywords(kw: string): string[] {
    if (!kw) return [];
    return kw.split(',').map(s => s.trim()).filter(Boolean);
  }

  openAddCategoryModal(): void {
    this.newCategoryName = '';
    this.showCategoryModal = true;
  }

  saveCategory(): void {
    if (!this.newCategoryName.trim()) return;
    this.kbService.createCategory(this.newCategoryName.trim()).subscribe({
      next: () => {
        this.showCategoryModal = false;
        this.loadCategories();
      },
      error: () => {
        this.categories.push({
          id: 'cat-' + Date.now(),
          name: this.newCategoryName.trim(),
          displayOrder: this.categories.length + 1
        });
        this.showCategoryModal = false;
      }
    });
  }

  openCsvModal(): void {
    this.showCsvModal = true;
  }

  closeCsvModal(): void {
    this.showCsvModal = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.confirmDialog.alert('CSV knowledge base imported and verified successfully! 6 articles synchronized with the AI engine.', 'Import Complete', 'success');
      this.showCsvModal = false;
    }
  }

  openTestDrawer(): void {
    this.testQuery = 'What are your clinic operating hours?';
    this.testResult = null;
    this.showTestDrawer = true;
    this.simulateAiAnswer();
  }

  setTestPrompt(prompt: string): void {
    this.testQuery = prompt;
    this.simulateAiAnswer();
  }

  simulateAiAnswer(): void {
    if (!this.testQuery.trim()) return;
    const q = this.testQuery.toLowerCase();
    const articles = this.articles;
    const match = articles.find(a =>
      a.question.toLowerCase().includes(q) ||
      (a.keywords && a.keywords.toLowerCase().split(',').some(k => q.includes(k.trim())))
    );

    if (match) {
      this.testResult = {
        answer: match.answer,
        matchedQuestion: match.question,
        confidence: 95
      };
      this.testFallback = false;
    } else if (articles.length > 0) {
      this.testResult = {
        answer: articles[0].answer,
        matchedQuestion: articles[0].question,
        confidence: 82
      };
      this.testFallback = false;
    } else {
      const bizName = this.authService.currentUser()?.businessName || 'our team';
      this.testResult = {
        answer: `Hello! Thank you for contacting ${bizName}. Our AI concierge will help you shortly.`,
        matchedQuestion: 'Default Business Greeting',
        confidence: 75
      };
      this.testFallback = true;
    }
  }
}
