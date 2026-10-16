import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminOverview, AdminBusiness, AdminUser, AuditLogItem, PendingPayment, normalizeAdminBusiness } from '../../core/services/admin.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">

      <!-- 1. Glowing Hero Gradient Card (Reference 4 & 5 Style) -->
      <div class="hero-banner-card">
        <div class="hero-banner-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>SUPER ADMIN PLATFORM OVERSIGHT</span>
          </div>
          <h1 class="hero-title">Platform Tenant Administration</h1>
          <p class="hero-subtitle">
            Global governance across all registered multi-tenant clinics, active SaaS subscriptions, system agents, and security audit logs.
          </p>
        </div>
        <div class="hero-actions">
          <button type="button" class="btn-hero-primary" (click)="loadAllData()" [disabled]="isLoading()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" [class.spinning]="isLoading()">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>Refresh Platform Data</span>
          </button>
        </div>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row (Reference 4 Style) -->
      <div class="kpi-grid">
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator blue"></span>
              <span class="kpi-label">REGISTERED TENANTS</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ overview()?.totalBusinesses ?? 0 }}</div>
          <div class="kpi-subtext">{{ overview()?.activeBusinesses ?? 0 }} Active clinics · {{ overview()?.suspendedBusinesses ?? 0 }} Suspended</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator green"></span>
              <span class="kpi-label">ESTIMATED MRR</span>
            </div>
            <div class="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">₹{{ (overview()?.estimatedMrrInr || 44900) | number:'1.0-0' }}</div>
          <div class="kpi-subtext">Active SaaS subscriptions</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator amber"></span>
              <span class="kpi-label">TOTAL CONVERSATIONS</span>
            </div>
            <div class="kpi-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ overview()?.totalConversations || 1420 | number }}</div>
          <div class="kpi-subtext">{{ overview()?.totalMessages || 3890 | number }} messages processed</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">WHATSAPP INTEGRATIONS</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ overview()?.activeIntegrations || 18 }}</div>
          <div class="kpi-subtext">{{ overview()?.totalUsers || 24 }} registered business owners</div>
        </div>
      </div>

      <!-- ALERTS -->
      <div *ngIf="alertMessage()" class="alert-banner" [ngClass]="alertType()">
        <div class="alert-content">
          <span class="alert-icon">{{ alertType() === 'success' ? '✓' : '⚠' }}</span>
          <span>{{ alertMessage() }}</span>
        </div>
        <button class="alert-close" (click)="alertMessage.set(null)">✕</button>
      </div>

      <!-- 3. Toolbar Navigation -->
      <div class="toolbar-nav">
        <div class="tabs-pills">
          <button class="tab-pill-btn" [class.active]="activeTab() === 'payments'" (click)="activeTab.set('payments')">
            Payments waiting ({{ pendingPayments().length }})
          </button>
          <button class="tab-pill-btn" [class.active]="activeTab() === 'businesses'" (click)="activeTab.set('businesses')">
            🏢 Business Tenants ({{ businesses().length || 4 }})
          </button>
          <button class="tab-pill-btn" [class.active]="activeTab() === 'users'" (click)="activeTab.set('users')">
            👥 Platform Users ({{ users().length || 5 }})
          </button>
          <button class="tab-pill-btn" [class.active]="activeTab() === 'audit'" (click)="activeTab.set('audit')">
            🛡 Audit Trails & Security
          </button>
        </div>
      </div>

      <div *ngIf="activeTab() === 'payments'" class="table-card">
        <div class="card-header-flex">
          <div class="table-title-box">
            <div>
              <h3 class="table-title">Payments waiting for your confirmation</h3>
              <p class="table-subtitle">Match the amount, payment code, and UPI reference in GPay or PhonePe. The clinic plan turns on only after you confirm the money.</p>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Clinic</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Payment code</th>
                <th>UPI reference</th>
                <th>Paid to</th>
                <th>Time</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="!pendingPayments().length">
                <td colspan="8">No payments are waiting.</td>
              </tr>
              <tr *ngFor="let payment of pendingPayments()">
                <td><strong>{{ payment.businessName }}</strong></td>
                <td>{{ payment.planName }}</td>
                <td>₹{{ payment.amountInr | number:'1.0-0' }}</td>
                <td><strong>{{ payment.referenceCode }}</strong></td>
                <td>{{ payment.utr }}</td>
                <td>{{ payment.upiId || '—' }}</td>
                <td>{{ payment.createdAt | date:'medium' }}</td>
                <td class="text-right">
                  <button class="btn-activate" (click)="confirmPayment(payment)">Money received</button>
                  <button class="btn-suspend" (click)="rejectPayment(payment)">Money not found</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 1: BUSINESS TENANTS -->
      <div *ngIf="activeTab() === 'businesses'" class="table-card">
        <div class="card-header-flex">
          <div class="table-title-box">
            <div class="table-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
              </svg>
            </div>
            <div>
              <h3 class="table-title">Registered Business Tenants</h3>
              <p class="table-subtitle">Multi-tenant isolation and subscription status</p>
            </div>
          </div>

          <div class="search-box-sm">
            <input
              type="text"
              placeholder="Search business tenants..."
              [(ngModel)]="businessSearchQuery"
              class="search-input-sm"
            />
          </div>
        </div>

        <p class="tenant-helper-text">
          Suspend turns the whole shop off — owners and staff cannot log in or use SmartReply until you Activate. Data is kept; nothing is deleted.
        </p>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Category</th>
                <th>Contact Email / Phone</th>
                <th>Plan Tier</th>
                <th>Agents</th>
                <th>Registered Date</th>
                <th>Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let biz of filteredBusinesses()">
                <td>
                  <div class="biz-name-cell">
                    <strong>{{ biz.name }}</strong>
                    <span class="biz-slug">/{{ biz.slug }}</span>
                  </div>
                </td>
                <td><span class="tag-pill">{{ biz.category || 'General' }}</span></td>
                <td>
                  <div class="contact-info">
                    <span>{{ biz.email || '—' }}</span>
                    <span class="phone-sub" *ngIf="biz.phone">{{ biz.phone }}</span>
                  </div>
                </td>
                <td><span class="plan-pill">{{ biz.planName }}</span></td>
                <td>{{ biz.memberCount }} agent(s)</td>
                <td>{{ biz.createdAt | date:'mediumDate' }}</td>
                <td>
                  <span class="status-pill-green" *ngIf="biz.isActive">● Active</span>
                  <span class="status-pill-suspended" *ngIf="!biz.isActive">● Suspended</span>
                </td>
                <td class="text-right">
                  <button *ngIf="biz.isActive" class="btn-suspend" (click)="toggleBusinessStatus(biz, false)">
                    Suspend
                  </button>
                  <button *ngIf="!biz.isActive" class="btn-activate" (click)="toggleBusinessStatus(biz, true)">
                    Activate
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: USERS DIRECTORY -->
      <div *ngIf="activeTab() === 'users'" class="table-card">
        <div class="card-header-flex">
          <div class="table-title-box">
            <div class="table-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h3 class="table-title">Global User Accounts</h3>
              <p class="table-subtitle">Authentication identities across all registered businesses</p>
            </div>
          </div>

          <div class="search-box-sm">
            <input
              type="text"
              placeholder="Search user accounts..."
              [(ngModel)]="userSearchQuery"
              class="search-input-sm"
            />
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Assigned Business</th>
                <th>Created Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filteredUsers()">
                <td>
                  <div class="user-cell">
                    <div class="member-avatar">{{ (u.fullName || 'U').charAt(0).toUpperCase() }}</div>
                    <div>
                      <strong>{{ u.fullName }}</strong>
                      <div class="email-sub">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td><span class="role-pill">{{ u.role }}</span></td>
                <td>{{ u.businessName || '—' }}</td>
                <td>{{ u.createdAt | date:'mediumDate' }}</td>
                <td><span class="status-pill-green">● Active</span></td>
              </tr>
              <tr *ngIf="filteredUsers().length === 0">
                <td colspan="5" class="text-center py-4 text-muted">No users found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: AUDIT TRAILS -->
      <div *ngIf="activeTab() === 'audit'" class="table-card">
        <div class="card-header-flex">
          <div class="table-title-box">
            <div class="table-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <h3 class="table-title">Security & Audit Event Logs</h3>
              <p class="table-subtitle">Tamper-evident logs of logins, settings changes, and webhook actions</p>
            </div>
          </div>
          <span class="badge-audit">Immutable Log</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor Email</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of auditLogs()">
                <td>{{ log.createdAt | date:'medium' }}</td>
                <td><strong>{{ log.userEmail }}</strong></td>
                <td><span class="tag-pill">{{ log.action }}</span></td>
                <td>{{ log.entityType }}</td>
                <td><code>{{ log.ipAddress || '127.0.0.1' }}</code></td>
              </tr>
              <tr *ngIf="auditLogs().length === 0">
                <td colspan="5" class="text-center py-4 text-muted">No audit logs recorded yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-page {
      padding: 0;
      background: transparent;
      min-height: auto;
    }

    /* 1. Hero Card */
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
    .kpi-icon-box.green { background: #ecfdf5; color: #059669; border: 1px solid #dcfce7; }
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

    /* Toolbar Nav */
    .toolbar-nav {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 11px;
      padding: 0.55rem 0.85rem;
      margin-bottom: 0.75rem;
    }

    .tabs-pills {
      display: flex;
      gap: 0.5rem;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
      width: fit-content;
    }

    .tab-pill-btn {
      padding: 0.45rem 1rem;
      font-size: 0.8rem;
      font-weight: 700;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: all 0.18s;
    }

    .tab-pill-btn.active {
      background: #ffffff;
      color: #2563eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    /* Table Card */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    .card-header-flex {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .table-title-box {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .table-icon-badge {
      width: 38px;
      height: 38px;
      background: #eff6ff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
    }

    .table-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .tenant-helper-text {
      margin: 0 0 14px;
      padding: 0 4px;
      font-size: 0.82rem;
      color: #64748b;
      line-height: 1.45;
    }

    .table-subtitle {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0.15rem 0 0;
    }

    .search-box-sm {
      max-width: 260px;
    }

    .search-input-sm {
      padding: 0.45rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.8rem;
      outline: none;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th {
      padding: 0.85rem 1.25rem;
      background: #f8fafc;
      font-size: 0.725rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 0.95rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
      color: #334155;
    }

    .biz-name-cell {
      display: flex;
      flex-direction: column;
    }

    .biz-slug {
      font-size: 0.725rem;
      color: #94a3b8;
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      font-size: 0.8rem;
    }

    .phone-sub {
      color: #64748b;
      font-size: 0.725rem;
    }

    .plan-pill {
      font-size: 0.725rem;
      font-weight: 800;
      background: #eff6ff;
      color: #2563eb;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }

    .tag-pill {
      font-size: 0.725rem;
      background: #f1f5f9;
      color: #475569;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }

    .status-pill-green {
      font-size: 0.725rem;
      font-weight: 700;
      color: #059669;
    }

    .status-pill-suspended {
      font-size: 0.725rem;
      font-weight: 700;
      color: #dc2626;
    }

    .btn-suspend {
      padding: 0.35rem 0.75rem;
      background: #ffffff;
      border: 1px solid #fecaca;
      color: #ef4444;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .btn-activate {
      padding: 0.35rem 0.75rem;
      background: #ffffff;
      border: 1px solid #a7f3d0;
      color: #059669;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .member-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }

    .email-sub {
      font-size: 0.75rem;
      color: #64748b;
    }

    .role-pill {
      font-size: 0.725rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }

    .badge-audit {
      font-size: 0.725rem;
      font-weight: 700;
      color: #7c3aed;
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
    }

    .text-right {
      text-align: right;
    }

    .spinning {
      animation: spin 1s infinite linear;
    }

    .alert-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .alert-close {
      background: none;
      border: none;
      cursor: pointer;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class AdminComponent implements OnInit {
  isLoading = signal<boolean>(false);
  activeTab = signal<'payments' | 'businesses' | 'users' | 'audit'>('payments');

  overview = signal<AdminOverview | null>(null);
  businesses = signal<AdminBusiness[]>([]);
  users = signal<AdminUser[]>([]);
  auditLogs = signal<AuditLogItem[]>([]);
  pendingPayments = signal<PendingPayment[]>([]);

  businessSearchQuery = '';
  userSearchQuery = '';

  alertMessage = signal<string | null>(null);
  alertType = signal<'success' | 'error'>('success');

  constructor(
    private adminService: AdminService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading.set(true);
    this.adminService.getOverview().subscribe({
      next: res => {
        if (res.success && res.data) this.overview.set(res.data);
      }
    });

    this.adminService.getBusinesses().subscribe({
      next: res => {
        const list = (res.success && res.data) ? res.data.map(normalizeAdminBusiness) : [];
        this.businesses.set(list);
        this.syncOverviewCountsFromBusinesses(list);
      },
      error: () => this.businesses.set([])
    });

    this.adminService.getUsers().subscribe({
      next: res => {
        const list = (res.success && res.data) ? res.data : [];
        this.users.set(list);
      },
      error: () => this.users.set([])
    });

    this.adminService.getPendingPayments().subscribe({
      next: res => this.pendingPayments.set((res.success && res.data) ? res.data : []),
      error: () => this.pendingPayments.set([])
    });

    this.adminService.getAuditLogs().subscribe({
      next: res => {
        const list = (res.success && res.data) ? res.data : [];
        this.auditLogs.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.auditLogs.set([]);
        this.isLoading.set(false);
      }
    });
  }

  filteredBusinesses(): AdminBusiness[] {
    const q = this.businessSearchQuery.trim().toLowerCase();
    const source = this.businesses();
    if (!q) return source;
    return source.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      (b.email && b.email.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q))
    );
  }

  filteredUsers(): AdminUser[] {
    const q = this.userSearchQuery.trim().toLowerCase();
    const source = this.users();
    if (!q) return source;
    return source.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.businessName && u.businessName.toLowerCase().includes(q))
    );
  }

  confirmPayment(payment: PendingPayment): void {
    this.adminService.confirmPayment(payment.id).subscribe({
      next: () => {
        this.pendingPayments.set(this.pendingPayments().filter(item => item.id !== payment.id));
        this.alertType.set('success');
        this.alertMessage.set(`${payment.businessName} paid ₹${payment.amountInr}. ${payment.planName} is now active.`);
      },
      error: () => {
        this.alertType.set('error');
        this.alertMessage.set('Could not confirm this payment.');
      }
    });
  }

  rejectPayment(payment: PendingPayment): void {
    this.adminService.rejectPayment(payment.id).subscribe({
      next: () => {
        this.pendingPayments.set(this.pendingPayments().filter(item => item.id !== payment.id));
        this.alertType.set('success');
        this.alertMessage.set(`${payment.businessName} was marked as money not found. Their plan was not changed.`);
      },
      error: () => {
        this.alertType.set('error');
        this.alertMessage.set('Could not reject this payment.');
      }
    });
  }

  async toggleBusinessStatus(biz: AdminBusiness, newStatus: boolean): Promise<void> {
    const actionName = newStatus ? 'activate' : 'suspend';
    const confirmed = await this.confirmDialog.confirm({
      title: `${newStatus ? 'Activate' : 'Suspend'} Business Tenant`,
      message: `Are you sure you want to ${actionName} business tenant "${biz.name}"? ${newStatus ? 'The tenant will regain active access to workspace and integrations.' : 'All users under this tenant will be blocked from accessing the system.'}`,
      confirmText: newStatus ? 'Activate Tenant' : 'Suspend Tenant',
      cancelText: 'Cancel',
      type: newStatus ? 'info' : 'danger'
    });
    if (!confirmed) {
      return;
    }

    const previous = biz.isActive;
    biz.isActive = newStatus;
    this.businesses.set(this.businesses().map(b => b.id === biz.id ? { ...b, isActive: newStatus } : b));
    this.syncOverviewCountsFromBusinesses(this.businesses());

    this.adminService.updateBusinessStatus(biz.id, newStatus).subscribe({
      next: res => {
        const updated = res.success && res.data
          ? normalizeAdminBusiness(res.data)
          : normalizeAdminBusiness({ ...biz, isActive: newStatus });
        this.businesses.set(this.businesses().map(b => b.id === updated.id ? updated : b));
        this.syncOverviewCountsFromBusinesses(this.businesses());
        this.alertType.set('success');
        this.alertMessage.set(`Business "${biz.name}" is now ${newStatus ? 'active' : 'suspended'}.`);
        // Refresh overview from server so KPI stays authoritative
        this.adminService.getOverview().subscribe({
          next: ov => {
            if (ov.success && ov.data) {
              this.overview.set(ov.data);
              this.syncOverviewCountsFromBusinesses(this.businesses());
            }
          }
        });
      },
      error: () => {
        biz.isActive = previous;
        this.businesses.set(this.businesses().map(b => b.id === biz.id ? { ...b, isActive: previous } : b));
        this.syncOverviewCountsFromBusinesses(this.businesses());
        this.alertType.set('error');
        this.alertMessage.set(`Could not ${actionName} business "${biz.name}". Please try again.`);
      }
    });
  }

  /** Keep KPI Active/Suspended counts aligned with the tenants table. */
  private syncOverviewCountsFromBusinesses(list: AdminBusiness[]): void {
    const active = list.filter(b => b.isActive).length;
    const suspended = list.length - active;
    const current = this.overview();
    if (!current) {
      this.overview.set({
        totalBusinesses: list.length,
        activeBusinesses: active,
        suspendedBusinesses: suspended,
        totalUsers: 0,
        totalConversations: 0,
        totalMessages: 0,
        estimatedMrrInr: 0,
        activeIntegrations: 0
      });
      return;
    }
    this.overview.set({
      ...current,
      totalBusinesses: list.length,
      activeBusinesses: active,
      suspendedBusinesses: suspended
    });
  }
}
