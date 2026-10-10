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
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Customer Directory</h1>
          <p class="page-subtitle">Manage customer contact cards, WhatsApp opt-in statuses, and personalized notes</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary" (click)="exportCsv()" [disabled]="isExporting">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" x2="12" y1="15" y2="3"></line>
            </svg>
            {{ isExporting ? 'Exporting...' : 'Export CSV' }}
          </button>
          <button class="btn btn-primary" (click)="openAddModal()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" x2="12" y1="5" y2="19"></line>
              <line x1="5" x2="19" y1="12" y2="12"></line>
            </svg>
            Add New Customer
          </button>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="card toolbar-card">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Search by name, phone number, or email..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadCustomers()"
          />
          <button class="btn btn-secondary btn-sm" (click)="loadCustomers()">Search</button>
          <button class="btn btn-secondary btn-sm" *ngIf="searchQuery" (click)="clearSearch()">Clear</button>
        </div>

        <div class="count-badge">
          Total Customers: <strong>{{ totalCustomers }}</strong>
        </div>
      </div>

      <!-- Data Table Card -->
      <div class="card table-card">
        <div class="table-responsive" *ngIf="!isLoading; else loadingState">
          <table class="data-table" *ngIf="customers.length > 0; else emptyState">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone (WhatsApp)</th>
                <th>Opt-in Status</th>
                <th>Tags</th>
                <th>Added Date</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of customers" class="table-row" (click)="selectCustomer(c)">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">{{ (c.name || c.phoneNumber).charAt(0).toUpperCase() }}</div>
                    <div>
                      <div class="user-name">{{ c.name || 'Unnamed Contact' }}</div>
                      <div class="user-email">{{ c.email || 'No email provided' }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="phone-tag">{{ c.phoneNumber }}</span>
                </td>
                <td>
                  <span class="badge" [class.badge-green]="c.optInStatus === 'OPTED_IN'" [class.badge-amber]="c.optInStatus === 'OPTED_OUT'">
                    {{ c.optInStatus === 'OPTED_IN' ? 'Opted In' : 'Opted Out' }}
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
                  <button class="action-btn" (click)="selectCustomer(c)" title="View & Edit Notes">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </button>
                  <button class="action-btn danger" (click)="deleteCustomer(c)" title="Delete Customer">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #loadingState>
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Loading customer records...</p>
          </div>
        </ng-template>

        <ng-template #emptyState>
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h4>No customer profiles found</h4>
            <p>Add your existing customer database or wait for incoming WhatsApp messages to automatically register customer profiles.</p>
            <button class="btn btn-primary btn-sm" (click)="openAddModal()">Add Your First Customer</button>
          </div>
        </ng-template>
      </div>

      <!-- Add Customer Modal -->
      <div class="modal-backdrop" *ngIf="showAddModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Add New Customer Profile</h3>
            <button class="close-btn" (click)="showAddModal = false">&times;</button>
          </div>

          <form [formGroup]="customerForm" (ngSubmit)="saveCustomer()">
            <div class="form-group">
              <label class="form-label">Phone Number (with Country Code)*</label>
              <input type="text" class="form-input" formControlName="phoneNumber" placeholder="+91 98765 00000" />
            </div>

            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-input" formControlName="name" placeholder="Meera Joshi" />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-input" formControlName="email" placeholder="meera@example.com" />
            </div>

            <div class="form-group">
              <label class="form-label">Tags (comma separated)</label>
              <input type="text" class="form-input" formControlName="tagsInput" placeholder="VIP, Implants, High Priority" />
            </div>

            <div class="form-group">
              <label class="form-label">Internal Business Notes</label>
              <textarea class="form-textarea" rows="3" formControlName="notes" placeholder="Notes on preferred treatments or appointment preferences..."></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showAddModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="customerForm.invalid || isSaving">
                {{ isSaving ? 'Saving...' : 'Save Customer' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Customer Detail / Notes Drawer -->
      <div class="modal-backdrop" *ngIf="selectedCustomer">
        <div class="drawer-card">
          <div class="drawer-header">
            <div>
              <h3>{{ selectedCustomer.name || selectedCustomer.phoneNumber }}</h3>
              <span class="phone-subtitle">{{ selectedCustomer.phoneNumber }}</span>
            </div>
            <button class="close-btn" (click)="selectedCustomer = null">&times;</button>
          </div>

          <div class="drawer-body">
            <div class="detail-section">
              <label class="section-label">WhatsApp Messaging Permission</label>
              <div class="opt-in-toggle">
                <button
                  type="button"
                  class="toggle-btn"
                  [class.active]="selectedCustomer.optInStatus === 'OPTED_IN'"
                  (click)="updateOptInStatus('OPTED_IN')"
                >
                  Opted In
                </button>
                <button
                  type="button"
                  class="toggle-btn"
                  [class.active]="selectedCustomer.optInStatus === 'OPTED_OUT'"
                  (click)="updateOptInStatus('OPTED_OUT')"
                >
                  Opted Out
                </button>
              </div>
            </div>

            <div class="detail-section">
              <label class="section-label">Customer Tags</label>
              <div class="tags-wrapper">
                <span class="tag-pill" *ngFor="let t of parseTags(selectedCustomer.tagsJson)">{{ t }}</span>
                <span class="no-tags" *ngIf="!parseTags(selectedCustomer.tagsJson).length">No tags attached</span>
              </div>
            </div>

            <div class="detail-section">
              <label class="section-label">Internal Notes</label>
              <textarea
                class="form-textarea"
                rows="5"
                [(ngModel)]="selectedCustomer.notes"
                placeholder="Add medical history, treatment notes, or service preferences..."
              ></textarea>
              <button class="btn btn-primary btn-sm save-notes-btn" (click)="saveCustomerNotes()">
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
      gap: 0.75rem;
    }

    .toolbar-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      max-width: 500px;
      position: relative;
    }

    .search-icon {
      width: 16px;
      height: 16px;
      color: var(--slate-400);
      position: absolute;
      left: 0.75rem;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--primary-500);
    }

    .count-badge {
      font-size: 0.8125rem;
      color: var(--slate-600);
    }

    .table-card {
      padding: 0;
      overflow: hidden;
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
      background: var(--slate-50);
      padding: 0.875rem 1.25rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--slate-200);
    }

    .data-table td {
      padding: 1rem 1.25rem;
      font-size: 0.875rem;
      border-bottom: 1px solid var(--slate-100);
      color: var(--slate-800);
    }

    .table-row {
      cursor: pointer;
      transition: background 0.15s ease;
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
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--primary-100);
      color: var(--primary-700);
      font-weight: 700;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-name {
      font-weight: 700;
      color: var(--slate-900);
    }

    .user-email {
      font-size: 0.75rem;
      color: var(--slate-500);
    }

    .phone-tag {
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      color: var(--slate-700);
    }

    .tags-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .tag-pill {
      font-size: 0.6875rem;
      font-weight: 600;
      background: var(--slate-100);
      color: var(--slate-700);
      border: 1px solid var(--slate-200);
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
    }

    .no-tags {
      color: var(--slate-400);
      font-size: 0.75rem;
    }

    .date-text {
      font-size: 0.8125rem;
      color: var(--slate-500);
    }

    .text-right {
      text-align: right;
    }

    .action-btn {
      background: transparent;
      border: none;
      color: var(--slate-400);
      cursor: pointer;
      padding: 0.375rem;
      border-radius: 6px;
      transition: all 0.15s ease;
    }

    .action-btn:hover {
      color: var(--primary-600);
      background: var(--primary-50);
    }

    .action-btn.danger:hover {
      color: var(--danger-text);
      background: var(--danger-bg);
    }

    .loading-box {
      text-align: center;
      padding: 3rem;
      color: var(--slate-500);
    }

    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid var(--slate-200);
      border-top-color: var(--primary-600);
      border-radius: 50%;
      margin: 0 auto 0.75rem;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 3.5rem 1.5rem;
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

    .empty-state h4 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.375rem;
    }

    .empty-state p {
      font-size: 0.8125rem;
      max-width: 440px;
      margin: 0 auto 1.25rem;
      color: var(--slate-500);
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
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
      max-width: 480px;
      background: #ffffff;
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow-xl);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
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

    /* Drawer Card */
    .drawer-card {
      width: 100%;
      max-width: 440px;
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

    .drawer-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .phone-subtitle {
      font-size: 0.8125rem;
      font-family: var(--font-mono);
      color: var(--slate-500);
    }

    .detail-section {
      margin-bottom: 1.5rem;
    }

    .section-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .opt-in-toggle {
      display: flex;
      gap: 0.5rem;
    }

    .toggle-btn {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid var(--slate-200);
      background: #ffffff;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--slate-600);
    }

    .toggle-btn.active {
      background: var(--primary-50);
      border-color: var(--primary-600);
      color: var(--primary-700);
    }

    .save-notes-btn {
      margin-top: 0.75rem;
    }
  `]
})
export class CustomersComponent implements OnInit {
  private customerService = inject(CustomerService);
  private fb = inject(FormBuilder);

  customers: Customer[] = [];
  totalCustomers = 0;
  searchQuery = '';
  isLoading = false;
  isExporting = false;
  showAddModal = false;
  isSaving = false;
  selectedCustomer: Customer | null = null;

  customerForm: FormGroup = this.fb.group({
    phoneNumber: ['', Validators.required],
    name: [''],
    email: [''],
    tagsInput: [''],
    notes: ['']
  });

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getCustomers(this.searchQuery).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.customers = res.data.content;
          this.totalCustomers = res.data.totalElements;
        }
      },
      error: () => {
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
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Failed to save customer');
      }
    });
  }

  selectCustomer(c: Customer): void {
    this.selectedCustomer = { ...c };
  }

  updateOptInStatus(status: string): void {
    if (!this.selectedCustomer) return;
    this.customerService.updateCustomer(this.selectedCustomer.id, { optInStatus: status }).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedCustomer!.optInStatus = status;
          this.loadCustomers();
        }
      }
    });
  }

  saveCustomerNotes(): void {
    if (!this.selectedCustomer) return;
    this.customerService.updateCustomer(this.selectedCustomer.id, { notes: this.selectedCustomer.notes }).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Customer notes updated successfully');
          this.loadCustomers();
        }
      }
    });
  }

  deleteCustomer(c: Customer): void {
    if (confirm(`Are you sure you want to delete ${c.name || c.phoneNumber}?`)) {
      this.customerService.deleteCustomer(c.id).subscribe({
        next: () => {
          this.loadCustomers();
        }
      });
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
        alert('Failed to export CSV');
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
}
