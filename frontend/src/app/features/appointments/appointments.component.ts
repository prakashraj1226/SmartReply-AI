import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService, Appointment, CreateAppointmentRequest } from '../../core/services/appointment.service';
import { CustomerService, Customer } from '../../core/services/customer.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="appointments-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>Appointment Management</h2>
          <p class="subtitle">Organize bookings, schedule consultations, and prevent conflicting slots</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openBookingModal()">
            + Book Appointment
          </button>
        </div>
      </div>

      <!-- ALERTS -->
      <div *ngIf="alertMsg" class="alert" [ngClass]="alertType">
        <span>{{ alertMsg }}</span>
        <button class="alert-close" (click)="alertMsg = ''">✕</button>
      </div>

      <!-- FILTER & VIEW CONTROLS -->
      <div class="view-controls-bar">
        <div class="view-tabs">
          <button [class.active]="viewMode() === 'UPCOMING'" (click)="setViewMode('UPCOMING')">Upcoming</button>
          <button [class.active]="viewMode() === 'ALL'" (click)="setViewMode('ALL')">All History</button>
        </div>
      </div>

      <!-- APPOINTMENTS LIST / TABLE -->
      <div class="card appointments-card">
        <div *ngIf="isLoading()" class="loading-state">
          <div class="spinner"></div>
          <p>Loading appointments...</p>
        </div>

        <div *ngIf="!isLoading() && appointments().length === 0" class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>No appointments scheduled</h3>
          <p>Create your first appointment booking to streamline your schedule.</p>
          <button class="btn btn-primary mt-3" (click)="openBookingModal()">+ Book First Appointment</button>
        </div>

        <div *ngIf="!isLoading() && appointments().length > 0" class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Staff</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Notes</th>
                <th style="text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let apt of appointments()">
                <td>
                  <div class="customer-cell">
                    <span class="cust-name">{{ apt.customerName }}</span>
                    <span class="cust-phone">{{ apt.customerPhone }}</span>
                  </div>
                </td>
                <td>
                  <span class="service-pill">{{ apt.serviceName }}</span>
                </td>
                <td>{{ apt.staffName || 'Unassigned' }}</td>
                <td>
                  <div class="time-cell">
                    <strong>{{ formatBookingDate(apt.startTime) }}</strong>
                    <span>{{ formatTimeRange(apt.startTime, apt.endTime) }}</span>
                  </div>
                </td>
                <td>
                  <span class="status-badge" [attr.data-status]="apt.status">{{ apt.status }}</span>
                </td>
                <td class="notes-cell">{{ apt.notes || '—' }}</td>
                <td style="text-align: right">
                  <button
                    *ngIf="apt.status !== 'CANCELLED'"
                    class="btn btn-sm btn-outline text-danger"
                    (click)="cancelBooking(apt.id)"
                  >
                    Cancel
                  </button>
                  <span *ngIf="apt.status === 'CANCELLED'" class="text-muted text-sm">Cancelled</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- BOOKING MODAL -->
    <div *ngIf="showBookingModal" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>📅 Book New Appointment</h3>
          <button class="close-btn" (click)="closeBookingModal()">✕</button>
        </div>
        <form (ngSubmit)="submitBooking()">
          <div class="modal-body">
            <div *ngIf="bookingError" class="alert error">
              <span>{{ bookingError }}</span>
            </div>

            <div class="form-group">
              <label>Customer *</label>
              <select [(ngModel)]="bookingData.customerId" name="customerId" class="form-control" required>
                <option value="" disabled>Select customer...</option>
                <option *ngFor="let c of customers()" [value]="c.id">
                  {{ c.name }} ({{ c.phoneNumber }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Service *</label>
              <input
                type="text"
                class="form-control"
                placeholder="e.g. Dental Scaling, Consultation, Teeth Whitening"
                [(ngModel)]="bookingData.serviceName"
                name="serviceName"
                required
              />
            </div>

            <div class="form-group">
              <label>Staff Doctor / Specialist</label>
              <input
                type="text"
                class="form-control"
                placeholder="e.g. Dr. Rajesh Gupta"
                [(ngModel)]="bookingData.staffName"
                name="staffName"
              />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Date *</label>
                <input
                  type="date"
                  class="form-control"
                  [(ngModel)]="bookingDate"
                  name="bookingDate"
                  required
                />
              </div>
              <div class="form-group flex-1">
                <label>Start Time *</label>
                <input
                  type="time"
                  class="form-control"
                  [(ngModel)]="bookingStartTime"
                  name="bookingStartTime"
                  required
                />
              </div>
              <div class="form-group flex-1">
                <label>End Time *</label>
                <input
                  type="time"
                  class="form-control"
                  [(ngModel)]="bookingEndTime"
                  name="bookingEndTime"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label>Notes / Requirements</label>
              <textarea
                class="form-control"
                rows="2"
                placeholder="Optional notes for patient or practitioner"
                [(ngModel)]="bookingData.notes"
                name="notes"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="closeBookingModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="isSubmitting()">
              <span *ngIf="!isSubmitting()">Confirm Booking</span>
              <span *ngIf="isSubmitting()" class="spinner-sm"></span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .appointments-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h2 {
      margin: 0 0 4px 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }

    .subtitle {
      color: #64748b;
      font-size: 0.9rem;
      margin: 0;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .alert.success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .alert.error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .alert-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      color: inherit;
    }

    .view-controls-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .view-tabs {
      display: flex;
      gap: 6px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 8px;
    }

    .view-tabs button {
      padding: 6px 14px;
      font-size: 0.85rem;
      font-weight: 600;
      border: none;
      background: none;
      color: #64748b;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .view-tabs button.active {
      background: #ffffff;
      color: var(--color-primary, #2563eb);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid var(--color-border, #e2e8f0);
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }

    .data-table th {
      padding: 14px 18px;
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 14px 18px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    .customer-cell {
      display: flex;
      flex-direction: column;
    }

    .cust-name {
      font-weight: 600;
      color: #0f172a;
    }

    .cust-phone {
      font-size: 0.78rem;
      color: #64748b;
    }

    .service-pill {
      background: #eff6ff;
      color: #1d4ed8;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .time-cell {
      display: flex;
      flex-direction: column;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .status-badge[data-status="CONFIRMED"] {
      background: #dcfce7;
      color: #166534;
    }

    .status-badge[data-status="CANCELLED"] {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-badge[data-status="COMPLETED"] {
      background: #e0e7ff;
      color: #3730a3;
    }

    .text-danger {
      color: #dc2626 !important;
      border-color: #fca5a5 !important;
    }

    .text-danger:hover {
      background: #fef2f2 !important;
    }

    .empty-state {
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 12px;
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
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
      max-width: 540px;
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
      font-size: 1.15rem;
      color: #0f172a;
    }

    .close-btn {
      background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #94a3b8;
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 14px;
    }

    .form-group label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 5px;
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

    .form-row {
      display: flex;
      gap: 12px;
    }

    .flex-1 { flex: 1; }

    .modal-footer {
      padding: 14px 20px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .spinner {
      width: 24px; height: 24px;
      border: 3px solid #e2e8f0;
      border-top-color: var(--color-primary, #2563eb);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 8px;
    }

    .spinner-sm {
      display: inline-block; width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AppointmentsComponent implements OnInit {
  appointments = signal<Appointment[]>([]);
  customers = signal<Customer[]>([]);
  viewMode = signal<'UPCOMING' | 'ALL'>('UPCOMING');

  isLoading = signal(false);
  isSubmitting = signal(false);

  showBookingModal = false;
  bookingError = '';
  alertMsg = '';
  alertType = 'success';

  bookingData = {
    customerId: '',
    serviceName: 'Dental Scaling & Polishing',
    staffName: 'Dr. Rajesh Gupta',
    notes: ''
  };
  bookingDate = '';
  bookingStartTime = '10:00';
  bookingEndTime = '11:00';

  constructor(
    private appointmentService: AppointmentService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    // Default booking date to tomorrow
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    this.bookingDate = tmrw.toISOString().split('T')[0];

    this.loadAppointments();
    this.loadCustomers();
  }

  loadAppointments(): void {
    this.isLoading.set(true);
    this.appointmentService.getAppointments(0, 50).subscribe({
      next: (res) => {
        const list = res.data?.content || [];
        if (this.viewMode() === 'UPCOMING') {
          const now = new Date().toISOString();
          this.appointments.set(list.filter(a => a.endTime >= now && a.status !== 'CANCELLED'));
        } else {
          this.appointments.set(list);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers('', 0, 50).subscribe({
      next: (res) => {
        const list = res.data?.content || [];
        this.customers.set(list);
        if (list.length > 0 && !this.bookingData.customerId) {
          this.bookingData.customerId = list[0].id;
        }
      }
    });
  }

  setViewMode(mode: 'UPCOMING' | 'ALL'): void {
    this.viewMode.set(mode);
    this.loadAppointments();
  }

  openBookingModal(): void {
    this.bookingError = '';
    this.showBookingModal = true;
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
  }

  submitBooking(): void {
    if (!this.bookingData.customerId || !this.bookingDate || !this.bookingStartTime || !this.bookingEndTime) {
      this.bookingError = 'Please fill all required fields';
      return;
    }

    const startIso = new Date(`${this.bookingDate}T${this.bookingStartTime}:00`).toISOString();
    const endIso = new Date(`${this.bookingDate}T${this.bookingEndTime}:00`).toISOString();

    const req: CreateAppointmentRequest = {
      customerId: this.bookingData.customerId,
      serviceName: this.bookingData.serviceName,
      staffName: this.bookingData.staffName,
      startTime: startIso,
      endTime: endIso,
      notes: this.bookingData.notes
    };

    this.isSubmitting.set(true);
    this.bookingError = '';
    this.appointmentService.createAppointment(req).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeBookingModal();
        this.alertType = 'success';
        this.alertMsg = 'Appointment confirmed and scheduled successfully!';
        this.loadAppointments();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.bookingError = err?.error?.message || 'Failed to book appointment. Check for conflicting schedules.';
      }
    });
  }

  cancelBooking(id: string): void {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => {
        this.alertType = 'success';
        this.alertMsg = 'Appointment cancelled.';
        this.loadAppointments();
      }
    });
  }

  formatBookingDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTimeRange(startStr: string, endStr: string): string {
    const s = new Date(startStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const e = new Date(endStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${s} - ${e}`;
  }
}
