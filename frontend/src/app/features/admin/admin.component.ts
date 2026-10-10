import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminOverview, AdminBusiness, AdminUser, AuditLogItem } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <!-- Page Header -->
      <header class="page-header">
        <div>
          <div class="header-badge-row">
            <h1 class="page-title">Platform Administration</h1>
            <span class="badge-super-admin">Super Admin Console</span>
          </div>
          <p class="page-subtitle">
            Global oversight across all registered business tenants, subscriptions, users, and audit events.
          </p>
        </div>
        <button class="btn btn-secondary" (click)="loadAllData()" [disabled]="isLoading()">
          <span class="refresh-icon" [class.spinning]="isLoading()">🔄</span> Refresh Data
        </button>
      </header>

      <!-- Alert / Toast -->
      @if (alertMessage()) {
        <div class="alert-banner" [ngClass]="alertType()">
          <span>{{ alertMessage() }}</span>
          <button class="close-alert-btn" (click)="alertMessage.set(null)">✕</button>
        </div>
      }

      <!-- Metric Cards Grid -->
      <section class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-box bg-blue">🏢</div>
          <div class="metric-details">
            <span class="metric-label">Total Businesses</span>
            <span class="metric-value">{{ overview()?.totalBusinesses || 0 }}</span>
            <span class="metric-subtext">{{ overview()?.activeBusinesses || 0 }} Active · {{ (overview()?.totalBusinesses || 0) - (overview()?.activeBusinesses || 0) }} Suspended</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-green">💰</div>
          <div class="metric-details">
            <span class="metric-label">Estimated Monthly Revenue</span>
            <span class="metric-value">₹{{ (overview()?.estimatedMrrInr || 0) | number:'1.0-0' }}</span>
            <span class="metric-subtext">Active SaaS subscriptions</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-purple">💬</div>
          <div class="metric-details">
            <span class="metric-label">Total Conversations</span>
            <span class="metric-value">{{ overview()?.totalConversations || 0 | number }}</span>
            <span class="metric-subtext">{{ overview()?.totalMessages || 0 | number }} messages exchanged</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-emerald">🟢</div>
          <div class="metric-details">
            <span class="metric-label">WhatsApp Accounts</span>
            <span class="metric-value">{{ overview()?.activeIntegrations || 0 }}</span>
            <span class="metric-subtext">{{ overview()?.totalUsers || 0 }} registered users</span>
          </div>
        </div>
      </section>

      <!-- Navigation Tabs -->
      <div class="tabs-nav">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'businesses'"
          (click)="activeTab.set('businesses')">
          Business Tenants ({{ businesses().length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'users'"
          (click)="activeTab.set('users')">
          User Directory ({{ users().length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'audit'"
          (click)="activeTab.set('audit')">
          Security & Audit Logs ({{ auditLogs().length }})
        </button>
      </div>

      <!-- Tab 1: Businesses -->
      @if (activeTab() === 'businesses') {
        <div class="content-card">
          <div class="card-toolbar">
            <h2 class="card-title">Registered Business Tenants</h2>
            <div class="search-box">
              <input
                type="text"
                placeholder="Search businesses..."
                [(ngModel)]="businessSearchQuery"
                class="search-input" />
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Category</th>
                  <th>Contact Email / Phone</th>
                  <th>Plan Tier</th>
                  <th>Team Size</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (biz of filteredBusinesses(); track biz.id) {
                  <tr>
                    <td>
                      <div class="biz-name-cell">
                        <span class="biz-title">{{ biz.name }}</span>
                        <span class="biz-slug">/{{ biz.slug }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="category-badge">{{ biz.category || 'General' }}</span>
                    </td>
                    <td>
                      <div class="contact-cell">
                        <span>{{ biz.email || '—' }}</span>
                        <span class="sub-contact">{{ biz.phone || '—' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="plan-badge">{{ biz.planName }}</span>
                    </td>
                    <td>{{ biz.memberCount }} agent(s)</td>
                    <td>{{ biz.createdAt | date:'mediumDate' }}</td>
                    <td>
                      <span class="status-pill" [class.status-active]="biz.isActive" [class.status-suspended]="!biz.isActive">
                        {{ biz.isActive ? 'Active' : 'Suspended' }}
                      </span>
                    </td>
                    <td>
                      @if (biz.isActive) {
                        <button class="btn-action-suspend" (click)="toggleBusinessStatus(biz, false)">
                          Suspend
                        </button>
                      } @else {
                        <button class="btn-action-activate" (click)="toggleBusinessStatus(biz, true)">
                          Activate
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="empty-cell">No business tenants found.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Tab 2: Users -->
      @if (activeTab() === 'users') {
        <div class="content-card">
          <div class="card-toolbar">
            <h2 class="card-title">Global User Directory</h2>
            <div class="search-box">
              <input
                type="text"
                placeholder="Search users..."
                [(ngModel)]="userSearchQuery"
                class="search-input" />
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Associated Business</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (u of filteredUsers(); track u.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar">{{ u.fullName.charAt(0) }}</div>
                        <strong>{{ u.fullName }}</strong>
                      </div>
                    </td>
                    <td>{{ u.email }}</td>
                    <td>
                      <span class="role-pill" [class.role-super]="u.role === 'SUPER_ADMIN'" [class.role-owner]="u.role === 'BUSINESS_OWNER'">
                        {{ u.role }}
                      </span>
                    </td>
                    <td>{{ u.businessName }}</td>
                    <td>{{ u.createdAt | date:'mediumDate' }}</td>
                    <td>
                      <span class="status-pill" [class.status-active]="u.isActive" [class.status-suspended]="!u.isActive">
                        {{ u.isActive ? 'Active' : 'Disabled' }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="empty-cell">No users found.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Tab 3: Audit Logs -->
      @if (activeTab() === 'audit') {
        <div class="content-card">
          <div class="card-toolbar">
            <h2 class="card-title">Security & Administrative Audit Trail</h2>
            <span class="text-muted">Latest 100 system audit records</span>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Actor Email</th>
                  <th>Business Tenant</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                @for (log of auditLogs(); track log.id) {
                  <tr>
                    <td class="text-nowrap">{{ log.createdAt | date:'short' }}</td>
                    <td>
                      <span class="action-tag">{{ log.action }}</span>
                    </td>
                    <td>{{ log.entityType || '—' }} #{{ (log.entityId || '').substring(0, 8) }}</td>
                    <td>{{ log.userEmail }}</td>
                    <td>{{ log.businessName }}</td>
                    <td><code>{{ log.ipAddress || '—' }}</code></td>
                    <td class="details-cell" [title]="log.detailsJson">{{ log.detailsJson || '—' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="empty-cell">No audit log records recorded yet.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 1.5rem;
      font-family: inherit;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .header-badge-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .badge-super-admin {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .page-subtitle {
      color: #64748b;
      margin-top: 0.35rem;
      font-size: 0.95rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .metric-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .bg-blue { background: #eff6ff; }
    .bg-green { background: #f0fdf4; }
    .bg-purple { background: #faf5ff; }
    .bg-emerald { background: #ecfdf5; }

    .metric-details {
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0.2rem 0;
    }

    .metric-subtext {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      padding: 0.75rem 1.25rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: #1e293b;
    }

    .tab-btn.active {
      color: #2563eb;
      border-bottom-color: #2563eb;
    }

    .content-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .card-toolbar {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .search-input {
      padding: 0.5rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.9rem;
      width: 240px;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    .data-table th {
      background: #f8fafc;
      padding: 0.85rem 1.25rem;
      color: #475569;
      font-weight: 600;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    .biz-name-cell {
      display: flex;
      flex-direction: column;
    }

    .biz-title {
      font-weight: 700;
      color: #0f172a;
    }

    .biz-slug {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .category-badge {
      background: #f1f5f9;
      color: #475569;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .contact-cell {
      display: flex;
      flex-direction: column;
    }

    .sub-contact {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .plan-badge {
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .status-pill {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .status-active {
      background: #dcfce7;
      color: #15803d;
    }

    .status-suspended {
      background: #fee2e2;
      color: #b91c1c;
    }

    .role-pill {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
    }

    .role-super {
      background: #fef3c7;
      color: #b45309;
    }

    .role-owner {
      background: #e0e7ff;
      color: #4338ca;
    }

    .btn-action-suspend {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-action-suspend:hover {
      background: #fecaca;
    }

    .btn-action-activate {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-action-activate:hover {
      background: #bbf7d0;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .user-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .action-tag {
      font-family: monospace;
      font-weight: 700;
      background: #f1f5f9;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #0f172a;
    }

    .details-cell {
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: monospace;
      font-size: 0.8rem;
      color: #64748b;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .btn-secondary {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #334155;
    }

    .btn-secondary:hover {
      background: #f1f5f9;
    }

    .alert-banner {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .alert-banner.success {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .alert-banner.error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .close-alert-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      color: inherit;
    }

    .spinning {
      animation: spin 1s infinite linear;
      display: inline-block;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .empty-cell {
      text-align: center;
      padding: 2.5rem;
      color: #94a3b8;
    }
  `]
})
export class AdminComponent implements OnInit {
  isLoading = signal<boolean>(false);
  activeTab = signal<'businesses' | 'users' | 'audit'>('businesses');

  overview = signal<AdminOverview | null>(null);
  businesses = signal<AdminBusiness[]>([]);
  users = signal<AdminUser[]>([]);
  auditLogs = signal<AuditLogItem[]>([]);

  businessSearchQuery = '';
  userSearchQuery = '';

  alertMessage = signal<string | null>(null);
  alertType = signal<'success' | 'error'>('success');

  constructor(private adminService: AdminService) {}

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
        if (res.success && res.data) this.businesses.set(res.data);
      }
    });

    this.adminService.getUsers().subscribe({
      next: res => {
        if (res.success && res.data) this.users.set(res.data);
      }
    });

    this.adminService.getAuditLogs().subscribe({
      next: res => {
        if (res.success && res.data) this.auditLogs.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  filteredBusinesses(): AdminBusiness[] {
    const q = this.businessSearchQuery.trim().toLowerCase();
    if (!q) return this.businesses();
    return this.businesses().filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      (b.email && b.email.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q))
    );
  }

  filteredUsers(): AdminUser[] {
    const q = this.userSearchQuery.trim().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.businessName.toLowerCase().includes(q)
    );
  }

  toggleBusinessStatus(biz: AdminBusiness, newStatus: boolean): void {
    const actionName = newStatus ? 'activate' : 'suspend';
    if (!confirm(`Are you sure you want to ${actionName} business tenant "${biz.name}"?`)) {
      return;
    }

    this.adminService.updateBusinessStatus(biz.id, newStatus).subscribe({
      next: res => {
        if (res.success) {
          this.alertType.set('success');
          this.alertMessage.set(`Business "${biz.name}" is now ${newStatus ? 'active' : 'suspended'}.`);
          this.loadAllData();
        }
      },
      error: err => {
        this.alertType.set('error');
        this.alertMessage.set(err.error?.message || `Failed to update status for ${biz.name}`);
      }
    });
  }
}
