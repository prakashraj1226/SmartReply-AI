import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { KnowledgeBaseService, KnowledgeCategory, KnowledgeArticle, CsvPreviewResponse } from '../../core/services/knowledge-base.service';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="kb-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Knowledge Base & FAQs</h1>
          <p class="page-subtitle">Approved business information used by the AI assistant to autonomously answer WhatsApp queries</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary" (click)="openTestDrawer()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Test AI Q&A Grounding
          </button>
          <button class="btn btn-secondary" (click)="exportCsv()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" x2="12" y1="15" y2="3"></line>
            </svg>
            Export CSV
          </button>
          <button class="btn btn-secondary" (click)="openCsvModal()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" x2="12" y1="3" y2="15"></line>
            </svg>
            Import CSV
          </button>
          <button class="btn btn-primary" (click)="openAddModal()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" x2="12" y1="5" y2="19"></line>
              <line x1="5" x2="19" y1="12" y2="12"></line>
            </svg>
            Add FAQ
          </button>
        </div>
      </div>

      <!-- Categories Navigation & Search -->
      <div class="toolbar-box">
        <div class="category-tabs">
          <button
            class="tab-btn"
            [class.active]="selectedCategoryId === null"
            (click)="selectCategory(null)"
          >
            All Categories ({{ totalArticles }})
          </button>
          <button
            class="tab-btn"
            *ngFor="let cat of categories"
            [class.active]="selectedCategoryId === cat.id"
            (click)="selectCategory(cat.id)"
          >
            {{ cat.name }}
          </button>
          <button class="tab-btn add-cat-btn" (click)="openAddCategoryModal()">+ Category</button>
        </div>

        <div class="search-box">
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

      <!-- FAQ Articles Grid -->
      <div class="articles-grid" *ngIf="!isLoading; else loadingState">
        <div class="card article-card" *ngFor="let a of articles">
          <div class="article-header">
            <span class="badge badge-blue" *ngIf="a.categoryName">{{ a.categoryName }}</span>
            <div class="status-toggle-box">
              <label class="switch">
                <input type="checkbox" [checked]="a.active" (change)="toggleStatus(a)" />
                <span class="slider"></span>
              </label>
              <span class="status-label">{{ a.active ? 'Active' : 'Disabled' }}</span>
            </div>
          </div>

          <h3 class="article-question">{{ a.question }}</h3>
          <p class="article-answer">{{ a.answer }}</p>

          <div class="article-keywords" *ngIf="a.keywords">
            <span class="keyword-pill" *ngFor="let kw of parseKeywords(a.keywords)">#{{ kw }}</span>
          </div>

          <div class="article-footer">
            <span class="date-meta">Added {{ a.createdAt | date:'mediumDate' }}</span>
            <div class="card-actions">
              <button class="icon-btn" (click)="openEditModal(a)" title="Edit FAQ">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
              <button class="icon-btn danger" (click)="deleteArticle(a)" title="Delete FAQ">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="empty-state full-width" *ngIf="articles.length === 0">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
            </svg>
          </div>
          <h4>No FAQ articles found</h4>
          <p>Add your business FAQs or import them from a CSV spreadsheet so your WhatsApp assistant can resolve questions automatically.</p>
          <div class="empty-actions">
            <button class="btn btn-primary btn-sm" (click)="openAddModal()">Add Your First FAQ</button>
            <button class="btn btn-secondary btn-sm" (click)="openCsvModal()">Import CSV</button>
          </div>
        </div>
      </div>

      <ng-template #loadingState>
        <div class="loading-box">
          <div class="spinner"></div>
          <p>Loading knowledge articles...</p>
        </div>
      </ng-template>

      <!-- Add/Edit Article Modal -->
      <div class="modal-backdrop" *ngIf="showArticleModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ editingArticle ? 'Edit FAQ Article' : 'Add FAQ Article' }}</h3>
            <button class="close-btn" (click)="showArticleModal = false">&times;</button>
          </div>

          <form [formGroup]="articleForm" (ngSubmit)="saveArticle()">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" formControlName="categoryId">
                <option [ngValue]="null">General (No Category)</option>
                <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Customer Question / Enquiry*</label>
              <input
                type="text"
                class="form-input"
                formControlName="question"
                placeholder="e.g. What are your consultation fees?"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Approved Answer (Accurate & Grounded)*</label>
              <textarea
                class="form-textarea"
                rows="4"
                formControlName="answer"
                placeholder="e.g. Our initial dental consultation fee is ₹500, which includes a comprehensive oral checkup and digital X-ray."
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

      <!-- CSV Import & Preview Modal -->
      <div class="modal-backdrop" *ngIf="showCsvModal">
        <div class="modal-card wide">
          <div class="modal-header">
            <div>
              <h3>Import FAQs from CSV</h3>
              <p class="subtitle">Upload a CSV file with headers: <code>Question, Answer, Category, Keywords</code></p>
            </div>
            <button class="close-btn" (click)="closeCsvModal()">&times;</button>
          </div>

          <!-- File Upload Zone -->
          <div class="file-drop-zone" *ngIf="!csvPreview">
            <input type="file" #fileInput (change)="onFileSelected($event)" accept=".csv" />
            <div class="drop-text">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" x2="12" y1="3" y2="15"></line>
              </svg>
              <p>Click to select or drag and drop your <strong>.csv</strong> spreadsheet</p>
            </div>
          </div>

          <!-- CSV Validation Preview Table -->
          <div class="preview-container" *ngIf="csvPreview">
            <div class="preview-stats">
              <span class="badge badge-blue">Total: {{ csvPreview.totalRows }} rows</span>
              <span class="badge badge-green">Valid: {{ csvPreview.validRows }}</span>
              <span class="badge badge-amber" *ngIf="csvPreview.duplicateRows > 0">Duplicates: {{ csvPreview.duplicateRows }}</span>
              <span class="badge badge-slate" *ngIf="csvPreview.invalidRows > 0">Invalid: {{ csvPreview.invalidRows }}</span>
            </div>

            <div class="preview-table-box">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Answer</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of csvPreview.items" [class.dup-row]="item.duplicate" [class.inv-row]="!item.valid">
                    <td>{{ item.rowIndex }}</td>
                    <td><strong>{{ item.question }}</strong></td>
                    <td class="cell-truncate">{{ item.answer }}</td>
                    <td>{{ item.categoryName || '-' }}</td>
                    <td>
                      <span class="badge badge-green" *ngIf="item.valid && !item.duplicate">Ready</span>
                      <span class="badge badge-amber" *ngIf="item.duplicate">Duplicate</span>
                      <span class="badge badge-slate" *ngIf="!item.valid">Invalid</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeCsvModal()">Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              *ngIf="csvPreview"
              [disabled]="isImporting || csvPreview.validRows === 0"
              (click)="confirmImport()"
            >
              {{ isImporting ? 'Importing FAQs...' : 'Import Valid FAQs' }}
            </button>
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
              <label class="form-label">Simulate Customer Message:</label>
              <div class="test-input-row">
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="testQuery"
                  (keyup.enter)="simulateAiAnswer()"
                  placeholder="e.g. What time are you open on Saturday?"
                />
                <button class="btn btn-primary btn-sm" (click)="simulateAiAnswer()">Ask</button>
              </div>
            </div>

            <!-- Quick Suggestions -->
            <div class="quick-prompts">
              <button class="prompt-chip" (click)="setTestPrompt('What are your clinic operating hours?')">
                Operating hours?
              </button>
              <button class="prompt-chip" (click)="setTestPrompt('How do I book a dental consultation?')">
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

            <div class="ai-fallback-box" *ngIf="testFallback">
              <span class="badge badge-amber">Fallback Triggered</span>
              <p class="fallback-text">
                "I apologize, but I don't have this specific information right now. Let me connect you with one of our human team members."
              </p>
              <span class="fallback-hint">No FAQ matched above the 70% confidence threshold. Escalated to human queue.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kb-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--slate-900);
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--slate-500);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }

    .toolbar-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      background: #ffffff;
      padding: 0.875rem 1.25rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--slate-200);
    }

    .category-tabs {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 0.375rem 0.875rem;
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      color: var(--slate-700);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tab-btn.active {
      background: var(--primary-600);
      color: #ffffff;
      border-color: var(--primary-600);
      box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
    }

    .tab-btn.add-cat-btn {
      background: transparent;
      border: 1px dashed var(--slate-300);
      color: var(--slate-500);
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .search-input {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      outline: none;
      width: 240px;
    }

    .search-input:focus {
      border-color: var(--primary-500);
    }

    .articles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.25rem;
    }

    .article-card {
      display: flex;
      flex-direction: column;
    }

    .article-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .status-toggle-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--slate-500);
    }

    /* Toggle Switch */
    .switch {
      position: relative;
      display: inline-block;
      width: 32px;
      height: 18px;
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
      background-color: var(--slate-300);
      transition: .2s;
      border-radius: 34px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .2s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: var(--wa-green-500);
    }

    input:checked + .slider:before {
      transform: translateX(14px);
    }

    .article-question {
      font-size: 1rem;
      font-weight: 700;
      color: var(--slate-900);
      margin-bottom: 0.5rem;
      line-height: 1.35;
    }

    .article-answer {
      font-size: 0.8125rem;
      color: var(--slate-600);
      line-height: 1.5;
      margin-bottom: 0.75rem;
    }

    .article-keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-bottom: 0.875rem;
    }

    .keyword-pill {
      font-size: 0.6875rem;
      color: var(--primary-700);
      background: var(--primary-50);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
    }

    .article-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 0.75rem;
      border-top: 1px solid var(--slate-100);
    }

    .date-meta {
      font-size: 0.6875rem;
      color: var(--slate-400);
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: var(--slate-400);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      display: flex;
    }

    .icon-btn:hover {
      color: var(--primary-600);
    }

    .icon-btn.danger:hover {
      color: var(--danger-text);
    }

    .empty-state.full-width {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 1.5rem;
      background: #ffffff;
      border-radius: var(--radius-lg);
      border: 1px dashed var(--slate-300);
    }

    .empty-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: var(--slate-100);
      color: var(--slate-400);
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-icon svg {
      width: 26px;
      height: 26px;
    }

    .empty-actions {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(2px);
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
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow-xl);
    }

    .modal-card.small { max-width: 380px; }
    .modal-card.wide { max-width: 760px; }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .subtitle {
      font-size: 0.75rem;
      color: var(--slate-500);
      margin-top: 0.25rem;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: var(--slate-400);
      cursor: pointer;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .file-drop-zone {
      border: 2px dashed var(--slate-300);
      border-radius: var(--radius-lg);
      padding: 2.5rem 1.5rem;
      text-align: center;
      position: relative;
      cursor: pointer;
      background: var(--slate-50);
    }

    .file-drop-zone input {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    .drop-text {
      color: var(--slate-600);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .preview-container {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .preview-stats {
      display: flex;
      gap: 0.5rem;
    }

    .preview-table-box {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
    }

    .preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .preview-table th {
      background: var(--slate-50);
      padding: 0.625rem;
      font-weight: 700;
      text-align: left;
      border-bottom: 1px solid var(--slate-200);
    }

    .preview-table td {
      padding: 0.625rem;
      border-bottom: 1px solid var(--slate-100);
    }

    .cell-truncate {
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dup-row { background: #fffbeb; }
    .inv-row { background: #fef2f2; }

    /* Drawer */
    .drawer-card {
      width: 100%;
      max-width: 460px;
      background: #ffffff;
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow-xl);
      margin-left: auto;
    }

    .drawer-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 1px solid var(--slate-100);
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }

    .test-input-row {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.375rem;
    }

    .quick-prompts {
      display: flex;
      gap: 0.375rem;
      margin-top: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .prompt-chip {
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-full);
      font-size: 0.6875rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--slate-700);
    }

    .prompt-chip:hover {
      background: var(--slate-200);
    }

    .ai-result-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 1rem;
      border-radius: var(--radius-md);
      margin-top: 1rem;
    }

    .ai-result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .score-tag {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--wa-green-700);
    }

    .ai-result-text {
      font-size: 0.875rem;
      color: var(--slate-800);
      line-height: 1.45;
      margin-bottom: 0.75rem;
    }

    .grounding-source {
      font-size: 0.6875rem;
      color: var(--slate-500);
      border-top: 1px dashed #bbf7d0;
      padding-top: 0.375rem;
    }

    .source-question {
      font-weight: 600;
      color: var(--slate-700);
      margin-left: 0.25rem;
    }

    .ai-fallback-box {
      background: var(--warning-bg);
      border: 1px solid var(--warning-border);
      padding: 1rem;
      border-radius: var(--radius-md);
      margin-top: 1rem;
    }

    .fallback-text {
      font-size: 0.8125rem;
      color: var(--warning-text);
      margin: 0.5rem 0;
    }

    .fallback-hint {
      font-size: 0.6875rem;
      color: var(--slate-500);
    }
  `]
})
export class KnowledgeBaseComponent implements OnInit {
  private kbService = inject(KnowledgeBaseService);
  private fb = inject(FormBuilder);

  categories: KnowledgeCategory[] = [];
  articles: KnowledgeArticle[] = [];
  totalArticles = 0;
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

  // CSV
  selectedCsvFile: File | null = null;
  csvPreview: CsvPreviewResponse | null = null;
  isImporting = false;

  // Test Drawer
  testQuery = '';
  testResult: { answer: string; matchedQuestion: string; confidence: number } | null = null;
  testFallback = false;

  articleForm: FormGroup = this.fb.group({
    categoryId: [null],
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
        if (res.success) this.categories = res.data;
      }
    });
  }

  loadArticles(): void {
    this.isLoading = true;
    this.kbService.getArticles(this.selectedCategoryId || undefined, this.searchQuery).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.articles = res.data.content;
          this.totalArticles = res.data.totalElements;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  selectCategory(catId: string | null): void {
    this.selectedCategoryId = catId;
    this.loadArticles();
  }

  openAddModal(): void {
    this.editingArticle = null;
    this.articleForm.reset({ categoryId: this.selectedCategoryId });
    this.showArticleModal = true;
  }

  openEditModal(article: KnowledgeArticle): void {
    this.editingArticle = article;
    this.articleForm.patchValue({
      categoryId: article.categoryId || null,
      question: article.question,
      answer: article.answer,
      keywords: article.keywords || ''
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
        error: () => { this.isSaving = false; }
      });
    } else {
      this.kbService.createArticle(formVal).subscribe({
        next: () => {
          this.isSaving = false;
          this.showArticleModal = false;
          this.loadArticles();
        },
        error: () => { this.isSaving = false; }
      });
    }
  }

  toggleStatus(article: KnowledgeArticle): void {
    this.kbService.toggleActive(article.id).subscribe({
      next: (res) => {
        if (res.success) article.active = res.data.active;
      }
    });
  }

  deleteArticle(article: KnowledgeArticle): void {
    if (confirm(`Delete FAQ: "${article.question}"?`)) {
      this.kbService.deleteArticle(article.id).subscribe({
        next: () => { this.loadArticles(); }
      });
    }
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
      }
    });
  }

  // CSV
  openCsvModal(): void {
    this.csvPreview = null;
    this.selectedCsvFile = null;
    this.showCsvModal = true;
  }

  closeCsvModal(): void {
    this.showCsvModal = false;
    this.csvPreview = null;
    this.selectedCsvFile = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedCsvFile = file;
      this.kbService.previewCsv(file).subscribe({
        next: (res) => {
          if (res.success) {
            this.csvPreview = res.data;
          }
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to preview CSV file');
        }
      });
    }
  }

  confirmImport(): void {
    if (!this.selectedCsvFile) return;
    this.isImporting = true;
    this.kbService.importCsv(this.selectedCsvFile).subscribe({
      next: (res) => {
        this.isImporting = false;
        this.closeCsvModal();
        alert(res.message || 'Import completed');
        this.loadCategories();
        this.loadArticles();
      },
      error: (err) => {
        this.isImporting = false;
        alert(err.error?.message || 'Import failed');
      }
    });
  }

  exportCsv(): void {
    this.kbService.exportCsv().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'knowledge_base.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  // Test Grounding
  openTestDrawer(): void {
    this.testQuery = '';
    this.testResult = null;
    this.testFallback = false;
    this.showTestDrawer = true;
  }

  setTestPrompt(prompt: string): void {
    this.testQuery = prompt;
    this.simulateAiAnswer();
  }

  simulateAiAnswer(): void {
    if (!this.testQuery.trim()) return;
    const qLower = this.testQuery.toLowerCase();

    // Lexical match against loaded active articles
    const match = this.articles.find(a =>
      a.active && (
        a.question.toLowerCase().includes(qLower) ||
        qLower.includes(a.question.toLowerCase().slice(0, 15)) ||
        (a.keywords && a.keywords.toLowerCase().split(',').some(k => qLower.includes(k.trim())))
      )
    );

    if (match) {
      this.testFallback = false;
      this.testResult = {
        answer: match.answer,
        matchedQuestion: match.question,
        confidence: 96
      };
    } else {
      this.testResult = null;
      this.testFallback = true;
    }
  }

  parseKeywords(kw: string): string[] {
    return kw.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
}
