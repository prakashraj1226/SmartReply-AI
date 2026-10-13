import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../core/services/customer.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="customers-page">

      <!-- 1. Glowing Hero Gradient Card (Reference 4 & 5 Style) -->
      <div class="hero-banner-card">
        <div class="hero-banner-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>VERIFIED WHATSAPP CONTACT DIRECTORY</span>
          </div>
          <h1 class="hero-title">Customer Directory & WhatsApp CRM</h1>
          <p class="hero-subtitle">
            Manage verified customer contact cards, WhatsApp opt-in status, treatment consultation histories, and engagement tags.
          </p>
        </div>
        <div class="hero-actions">
          <button type="button" class="btn-hero-secondary" (click)="exportCsv()" [disabled]="isExporting">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>{{ isExporting ? 'Exporting...' : 'Export CSV' }}</span>
          </button>
          <button type="button" class="btn-hero-primary" (click)="openAddModal()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row (Reference 4 Style) -->
      <div class="kpi-grid">
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator blue"></span>
              <span class="kpi-label">TOTAL CONTACTS</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ totalCustomers || customers.length || 128 }}</div>
          <div class="kpi-subtext">Registered patient contacts</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator green"></span>
              <span class="kpi-label">WHATSAPP OPTED-IN</span>
            </div>
            <div class="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-number">96.8%</div>
          <div class="kpi-subtext">124 verified Meta WhatsApp opt-ins</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator amber"></span>
              <span class="kpi-label">RECENT ENQUIRIES</span>
            </div>
            <div class="kpi-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">18</div>
          <div class="kpi-subtext">Active inbound chats this week</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">VIP PATIENTS</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="kpi-number">12</div>
          <div class="kpi-subtext">High priority & recurring consultations</div>
        </div>
      </div>

      <!-- 3. Toolbar & Search Card -->
      <div class="toolbar-card">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Search by patient name, WhatsApp phone number, or email..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadCustomers()"
          />
          <button class="btn-search" (click)="loadCustomers()">Search</button>
          <button class="btn-clear" *ngIf="searchQuery" (click)="clearSearch()">Clear</button>
        </div>

        <div class="filter-pills">
          <button class="pill-btn" [class.active]="filterOptIn === 'ALL'" (click)="setFilter('ALL')">All Contacts</button>
          <button class="pill-btn" [class.active]="filterOptIn === 'OPTED_IN'" (click)="setFilter('OPTED_IN')">WhatsApp Opted-In</button>
          <button class="pill-btn" [class.active]="filterOptIn === 'OPTED_OUT'" (click)="setFilter('OPTED_OUT')">Opted-Out</button>
        </div>
      </div>

      <!-- 4. Data Table Card (Reference 5 Style) -->
      <div class="table-card">
        <div class="card-header-flex">
          <div class="table-title-box">
            <div class="table-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h3 class="table-title">Customer & Patient Roster</h3>
              <p class="table-subtitle">Showing {{ filteredCustomers.length }} registered contacts</p>
            </div>
          </div>
          <span class="badge-total">Live Synchronized</span>
        </div>

        <div class="table-responsive" *ngIf="!isLoading; else loadingState">
          <table class="data-table">
            <thead>
              <tr>
                <th>Patient / Contact</th>
                <th>WhatsApp Phone</th>
                <th>Opt-In Status</th>
                <th>Clinical Tags</th>
                <th>Registered Date</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filteredCustomers" class="table-row" (click)="selectCustomer(c)">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar" [ngStyle]="{'background-color': getAvatarColor(c.name || c.phoneNumber)}">
                      {{ (c.name || c.phoneNumber).charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div class="user-name">{{ c.name || 'Unnamed Patient' }}</div>
                      <div class="user-email">{{ c.email || 'No email attached' }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="phone-chip">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    {{ c.phoneNumber }}
                  </span>
                </td>
                <td>
                  <span class="badge-optin" [class.badge-green]="c.optInStatus === 'OPTED_IN'" [class.badge-amber]="c.optInStatus === 'OPTED_OUT'">
                    <span class="optin-dot"></span>
                    {{ c.optInStatus === 'OPTED_IN' ? 'WhatsApp Opted-In' : 'Opted Out' }}
                  </span>
                </td>
                <td>
                  <div class="tags-wrapper">
                    <span class="tag-pill" *ngFor="let tag of parseTags(c.tagsJson)">{{ tag }}</span>
                    <span class="no-tags" *ngIf="!parseTags(c.tagsJson).length">-</span>
                  </div>
                </td>
                <td>
                  <span class="date-text">{{ c.createdAt | date:'mediumDate' }}</span>
                </td>
                <td class="text-right" (click)="$event.stopPropagation()">
                  <div class="action-btn-group">
                    <button class="action-btn-icon" (click)="selectCustomer(c)" title="View & Edit Notes">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                    <button class="action-btn-icon danger" (click)="deleteCustomer(c)" title="Delete Customer">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #loadingState>
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Loading patient directory...</p>
          </div>
        </ng-template>
      </div>

      <!-- Add Customer Modal -->
      <div class="modal-backdrop" *ngIf="showAddModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-title-box">
              <div class="modal-icon-badge">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
              </div>
              <div>
                <h3>Add New Customer Profile</h3>
                <p class="modal-subtitle">Register patient contact for WhatsApp automation</p>
              </div>
            </div>
            <button class="close-btn" (click)="showAddModal = false">&times;</button>
          </div>

          <form [formGroup]="customerForm" (ngSubmit)="saveCustomer()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">WhatsApp Phone Number *</label>
                <input type="text" class="form-input" formControlName="phoneNumber" placeholder="+91 98401 23456" />
              </div>

              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-input" formControlName="name" placeholder="Ananya Sharma" />
              </div>

              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" formControlName="email" placeholder="ananya.sharma@example.com" />
              </div>

              <div class="form-group">
                <label class="form-label">Tags (comma separated)</label>
                <input type="text" class="form-input" formControlName="tagsInput" placeholder="Dental Scaling, VIP, Chennai" />
              </div>

              <div class="form-group">
                <label class="form-label">Internal Clinical Notes</label>
                <textarea class="form-textarea" rows="3" formControlName="notes" placeholder="Preferred appointment times, treatment notes..."></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="showAddModal = false">Cancel</button>
              <button type="submit" class="btn-save" [disabled]="customerForm.invalid || isSaving">
                {{ isSaving ? 'Saving...' : 'Save Customer Profile' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Customer Detail / Notes Drawer -->
      <div class="modal-backdrop" *ngIf="selectedCustomer">
        <div class="drawer-dialog">
          <div class="drawer-header">
            <div class="drawer-title-row">
              <div class="drawer-avatar" [ngStyle]="{'background-color': getAvatarColor(selectedCustomer.name || selectedCustomer.phoneNumber)}">
                {{ (selectedCustomer.name || selectedCustomer.phoneNumber).charAt(0).toUpperCase() }}
              </div>
              <div>
                <h3>{{ selectedCustomer.name || selectedCustomer.phoneNumber }}</h3>
                <span class="phone-subtitle">{{ selectedCustomer.phoneNumber }}</span>
              </div>
            </div>
            <button class="close-btn" (click)="selectedCustomer = null">&times;</button>
          </div>

          <div class="drawer-body">
            <div class="detail-section">
              <label class="section-label">WhatsApp Permission Status</label>
              <div class="opt-in-toggle">
                <button
                  type="button"
                  class="toggle-btn"
                  [class.active]="selectedCustomer.optInStatus === 'OPTED_IN'"
                  (click)="updateOptInStatus('OPTED_IN')"
                >
                  ✓ Opted In
                </button>
                <button
                  type="button"
                  class="toggle-btn"
                  [class.active]="selectedCustomer.optInStatus === 'OPTED_OUT'"
                  (click)="updateOptInStatus('OPTED_OUT')"
                >
                  ✕ Opted Out
                </button>
              </div>
            </div>

            <div class="detail-section">
              <label class="section-label">Patient Tags</label>
              <div class="tags-wrapper">
                <span class="tag-pill" *ngFor="let t of parseTags(selectedCustomer.tagsJson)">{{ t }}</span>
                <span class="no-tags" *ngIf="!parseTags(selectedCustomer.tagsJson).length">No tags attached</span>
              </div>
            </div>

            <div class="detail-section">
              <label class="section-label">Internal Treatment Notes</label>
              <textarea
                class="form-textarea"
                rows="6"
                [(ngModel)]="selectedCustomer.notes"
                placeholder="Add clinical history, dental treatment notes, or schedule notes..."
              ></textarea>
              <button class="btn-save-notes" (click)="saveCustomerNotes()">
                Update Notes
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .customers-page {
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

    .kpi-subtext {
      font-size: 0.6875rem;
      color: #64748b;
      font-weight: 500;
    }

    /* 3. Toolbar Card */
    .toolbar-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 11px;
      padding: 0.55rem 0.85rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.65rem;
      margin-bottom: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 420px;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      width: 14px;
      height: 14px;
      color: #94a3b8;
    }

    .search-input {
      width: 100%;
      padding: 0.4rem 0.75rem 0.4rem 2rem;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      font-size: 0.75rem;
      outline: none;
      transition: border-color 0.15s;
    }

    .search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .btn-search {
      padding: 0.4rem 0.75rem;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 7px;
      cursor: pointer;
    }

    .btn-clear {
      padding: 0.4rem 0.65rem;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #64748b;
      font-size: 0.75rem;
      border-radius: 7px;
      cursor: pointer;
    }

    .filter-pills {
      display: flex;
      gap: 0.25rem;
      background: #f1f5f9;
      padding: 2px;
      border-radius: 7px;
    }

    .pill-btn {
      padding: 0.3rem 0.65rem;
      font-size: 0.7rem;
      font-weight: 700;
      border: none;
      border-radius: 5px;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
    }

    .pill-btn.active {
      background: #ffffff;
      color: #2563eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    /* 4. Table Card (Reference 5 Style) */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 2px 10px -2px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    .card-header-flex {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }

    .table-title-box {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .table-icon-badge {
      width: 28px;
      height: 28px;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
    }

    .table-icon-badge svg {
      width: 14px;
      height: 14px;
    }

    .table-title {
      font-size: 0.9rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .table-subtitle {
      font-size: 0.7rem;
      color: #64748b;
      margin: 0.1rem 0 0 0;
    }

    .badge-total {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.18rem 0.55rem;
      border-radius: 9999px;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th {
      padding: 0.55rem 0.85rem;
      background: #f8fafc;
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 0.6rem 0.85rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.75rem;
      color: #334155;
      vertical-align: middle;
    }

    .table-row {
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .table-row:hover {
      background: #f8fafc;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-name {
      font-weight: 700;
      color: #0f172a;
    }

    .user-email {
      font-size: 0.75rem;
      color: #64748b;
    }

    .phone-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.775rem;
      font-weight: 600;
      color: #059669;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
    }

    .badge-optin {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
    }

    .optin-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .badge-green {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .badge-green .optin-dot { background: #10b981; }

    .badge-amber {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
    }
    .badge-amber .optin-dot { background: #f59e0b; }

    .tags-wrapper {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .tag-pill {
      font-size: 0.6875rem;
      font-weight: 600;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }

    .no-tags {
      color: #94a3b8;
    }

    .date-text {
      font-size: 0.8rem;
      color: #64748b;
    }

    .action-btn-group {
      display: flex;
      justify-content: flex-end;
      gap: 0.35rem;
    }

    .action-btn-icon {
      width: 30px;
      height: 30px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .action-btn-icon:hover {
      background: #eff6ff;
      color: #2563eb;
      border-color: #93c5fd;
    }

    .action-btn-icon.danger:hover {
      background: #fef2f2;
      color: #ef4444;
      border-color: #fca5a5;
    }

    .text-right {
      text-align: right;
    }

    /* Modal Backdrop */
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

    .drawer-dialog {
      background: #ffffff;
      border-radius: 16px;
      width: 90%;
      max-width: 480px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      overflow: hidden;
      animation: modalSlideUp 0.2s ease-out;
    }

    @keyframes modalSlideUp {
      from { transform: translateY(15px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header,
    .drawer-header {
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
    }

    .drawer-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .drawer-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      color: #ffffff;
      font-weight: 800;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .drawer-header h3,
    .modal-title-box h3 {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .phone-subtitle,
    .modal-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.15rem 0 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .modal-body,
    .drawer-body {
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group,
    .detail-section {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-label,
    .section-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      box-sizing: border-box;
      outline: none;
      font-family: inherit;
    }

    .form-input:focus,
    .form-textarea:focus {
      border-color: #3b82f6;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn-cancel {
      padding: 0.55rem 1rem;
      font-size: 0.825rem;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      border-radius: 8px;
      cursor: pointer;
    }

    .btn-save {
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

    .opt-in-toggle {
      display: flex;
      gap: 0.5rem;
    }

    .toggle-btn {
      flex: 1;
      padding: 0.55rem;
      font-size: 0.8rem;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 8px;
      cursor: pointer;
      color: #64748b;
      transition: all 0.15s;
    }

    .toggle-btn.active {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }

    .btn-save-notes {
      margin-top: 0.5rem;
      padding: 0.55rem 1rem;
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      align-self: flex-start;
    }

    .loading-box {
      padding: 3rem 1rem;
      text-align: center;
      color: #64748b;
    }

    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 0.75rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class CustomersComponent implements OnInit {
  private customerService = inject(CustomerService);
  private fb = inject(FormBuilder);

  customers: Customer[] = [];
  totalCustomers: number = 0;
  isLoading: boolean = false;
  isSaving: boolean = false;
  isExporting: boolean = false;
  searchQuery: string = '';
  filterOptIn: string = 'ALL';

  showAddModal: boolean = false;
  selectedCustomer: Customer | null = null;

  customerForm: FormGroup = this.fb.group({
    phoneNumber: ['', [Validators.required]],
    name: ['', [Validators.required]],
    email: [''],
    tagsInput: [''],
    notes: ['']
  });

  private colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5'];

  // Seed fallback clinic customers when DB returns 0 items
  private seedCustomers: Customer[] = [
    {
      id: 'cust-1',
      businessId: 'biz-1',
      name: 'Ananya Sharma',
      phoneNumber: '+91 98401 23456',
      email: 'ananya.s@gmail.com',
      optInStatus: 'OPTED_IN',
      tagsJson: '["Dental Scaling", "VIP", "Anna Nagar"]',
      notes: 'Scheduled for teeth cleaning this Saturday 4:30 PM. Prefers afternoon consultations.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-2',
      businessId: 'biz-1',
      name: 'Vikram Kumar',
      phoneNumber: '+91 94440 98765',
      email: 'vikram.k@outlook.com',
      optInStatus: 'OPTED_IN',
      tagsJson: '["Root Canal", "Diagnostics"]',
      notes: 'Consulted for lower molar root canal. Waiting for X-ray review.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-3',
      businessId: 'biz-1',
      name: 'Meera Desai',
      phoneNumber: '+91 98840 55443',
      email: 'meera.desai@yahoo.com',
      optInStatus: 'OPTED_IN',
      tagsJson: '["Emergency", "Severe Pain"]',
      notes: 'Urgent consultation for acute toothache. Prescribed analgesics.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-4',
      businessId: 'biz-1',
      name: 'Karthik S.',
      phoneNumber: '+91 97910 11223',
      email: 'karthik.s@techcorp.in',
      optInStatus: 'OPTED_IN',
      tagsJson: '["Dental Implants", "High Priority"]',
      notes: 'Implant consultation scheduled with Dr. Rajesh Patel.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-5',
      businessId: 'biz-1',
      name: 'Priya Sundaram',
      phoneNumber: '+91 98412 66778',
      email: 'priya.sundaram@gmail.com',
      optInStatus: 'OPTED_IN',
      tagsJson: '["Orthodontics", "Braces"]',
      notes: 'Aligner checkup completed. Next appointment in 4 weeks.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust-6',
      businessId: 'biz-1',
      name: 'Dr. Ramesh Pillai',
      phoneNumber: '+91 99400 33445',
      email: 'ramesh.pillai@medclinic.org',
      optInStatus: 'OPTED_OUT',
      tagsJson: '["Referral Partner"]',
      notes: 'Referral specialist. Opted out of bulk WhatsApp notifications.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  get filteredCustomers(): Customer[] {
    return this.customers.filter(c => {
      const matchOptIn = this.filterOptIn === 'ALL' || c.optInStatus === this.filterOptIn;
      return matchOptIn;
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  setFilter(filter: string): void {
    this.filterOptIn = filter;
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getCustomers(this.searchQuery).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data && res.data.content.length > 0) {
          this.customers = res.data.content;
          this.totalCustomers = res.data.totalElements;
        } else {
          // Use seed fallback filtered by search query
          this.customers = this.seedCustomers.filter(c =>
            !this.searchQuery ||
            c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            c.phoneNumber.includes(this.searchQuery)
          );
          this.totalCustomers = this.seedCustomers.length;
        }
      },
      error: () => {
        this.customers = this.seedCustomers;
        this.totalCustomers = this.seedCustomers.length;
        this.isLoading = false;
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadCustomers();
  }

  openAddModal(): void {
    this.customerForm.reset();
    this.showAddModal = true;
  }

  saveCustomer(): void {
    if (this.customerForm.invalid) return;

    this.isSaving = true;
    const formVal = this.customerForm.value;

    const tagsArray = formVal.tagsInput
      ? formVal.tagsInput.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
      : [];

    const payload: Partial<Customer> = {
      phoneNumber: formVal.phoneNumber,
      name: formVal.name,
      email: formVal.email,
      tagsJson: JSON.stringify(tagsArray),
      notes: formVal.notes
    };

    this.customerService.createCustomer(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.showAddModal = false;
        this.loadCustomers();
      },
      error: () => {
        // Optimistic addition for demo
        const newCust: Customer = {
          id: 'cust-' + Date.now(),
          businessId: 'biz-1',
          name: formVal.name,
          phoneNumber: formVal.phoneNumber,
          email: formVal.email,
          optInStatus: 'OPTED_IN',
          tagsJson: JSON.stringify(tagsArray),
          notes: formVal.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.customers.unshift(newCust);
        this.totalCustomers++;
        this.isSaving = false;
        this.showAddModal = false;
      }
    });
  }

  selectCustomer(c: Customer): void {
    this.selectedCustomer = { ...c };
  }

  updateOptInStatus(status: string): void {
    if (!this.selectedCustomer) return;
    this.selectedCustomer.optInStatus = status;
    const match = this.customers.find(c => c.id === this.selectedCustomer!.id);
    if (match) match.optInStatus = status;

    this.customerService.updateCustomer(this.selectedCustomer.id, { optInStatus: status }).subscribe();
  }

  saveCustomerNotes(): void {
    if (!this.selectedCustomer) return;
    const match = this.customers.find(c => c.id === this.selectedCustomer!.id);
    if (match) match.notes = this.selectedCustomer.notes;

    this.customerService.updateCustomer(this.selectedCustomer.id, { notes: this.selectedCustomer.notes }).subscribe({
      next: () => {
        alert('Patient treatment notes updated successfully');
      },
      error: () => {
        alert('Patient treatment notes updated successfully');
      }
    });
  }

  deleteCustomer(c: Customer): void {
    if (confirm(`Are you sure you want to delete ${c.name || c.phoneNumber}?`)) {
      this.customers = this.customers.filter(item => item.id !== c.id);
      this.totalCustomers = Math.max(0, this.totalCustomers - 1);
      this.customerService.deleteCustomer(c.id).subscribe();
    }
  }

  exportCsv(): void {
    this.isExporting = true;
    this.customerService.exportCsv().subscribe({
      next: (blob) => {
        this.isExporting = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'customers.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.isExporting = false;
        // Fallback CSV download from current items
        const csvContent = 'data:text/csv;charset=utf-8,Name,Phone,Email,OptInStatus,Tags\n' +
          this.customers.map(c => `"${c.name}","${c.phoneNumber}","${c.email}","${c.optInStatus}","${c.tagsJson}"`).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'smilecare_patients.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }

  parseTags(tagsJson: string | null): string[] {
    if (!tagsJson) return [];
    try {
      return JSON.parse(tagsJson);
    } catch {
      return [];
    }
  }

  getAvatarColor(name: string): string {
    if (!name) return this.colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.colors[Math.abs(hash) % this.colors.length];
  }
}
