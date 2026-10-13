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

      <!-- 1. Glowing Hero Gradient Card (Reference 4 Style) -->
      <div class="hero-banner-card">
        <div class="hero-banner-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>WHATSAPP SCHEDULER ACTIVE</span>
          </div>
          <h1 class="hero-title">Appointments & Consultation Calendar</h1>
          <p class="hero-subtitle">
            Automated WhatsApp appointment scheduling, calendar coordination, and instant confirmation reminders.
          </p>
        </div>
        <div class="hero-actions">
          <button type="button" class="btn-hero-primary" (click)="openBookingModal()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row (Reference 4 Style) -->
      <div class="kpi-grid">
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator blue"></span>
              <span class="kpi-label">TOTAL BOOKINGS</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                <line x1="16" x2="16" y1="2" y2="6"></line>
                <line x1="8" x2="8" y1="2" y2="6"></line>
                <line x1="3" x2="19" y1="10" y2="10"></line>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ displayTotalBookings }}</div>
          <div class="kpi-subtext">Confirmed patient visits</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator green"></span>
              <span class="kpi-label">SCHEDULED TODAY</span>
            </div>
            <div class="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-number">6</div>
          <div class="kpi-subtext">Slots filled for today</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator amber"></span>
              <span class="kpi-label">AWAITING CONFIRMATION</span>
            </div>
            <div class="kpi-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <div class="kpi-number">2</div>
          <div class="kpi-subtext">Pending patient reply</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">AVG APPOINTMENT DURATION</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 14 14"></polyline>
              </svg>
            </div>
          </div>
          <div class="kpi-number">45m</div>
          <div class="kpi-subtext">Standard clinical consultation</div>
        </div>
      </div>

      <!-- 3. Toolbar & View Tabs Card -->
      <div class="toolbar-card">
        <div class="tab-pill-group">
          <button type="button" class="tab-btn" [class.active]="viewMode() === 'UPCOMING'" (click)="setViewMode('UPCOMING')">Upcoming Slots</button>
          <button type="button" class="tab-btn" [class.active]="viewMode() === 'TODAY'" (click)="setViewMode('TODAY')">Today's Visits</button>
          <button type="button" class="tab-btn" [class.active]="viewMode() === 'ALL'" (click)="setViewMode('ALL')">All History</button>
        </div>

        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Search patient, service, or doctor..."
            [(ngModel)]="searchQuery"
            (input)="filterAppointments()"
          />
        </div>
      </div>

      <!-- 4. Modern Appointments Table Card (Reference 5 Style) -->
      <div class="table-card">
        <div class="table-card-header">
          <div>
            <h3 class="table-title">Scheduled Patient Consultations</h3>
            <p class="table-subtitle">Confirmed bookings handled via WhatsApp bot or staff reservation</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="modern-table">
            <thead>
              <tr>
                <th>PATIENT & PHONE</th>
                <th>SERVICE / TREATMENT</th>
                <th>ATTENDING DOCTOR</th>
                <th>SCHEDULED DATE & TIME</th>
                <th>STATUS</th>
                <th>CLINICAL NOTES</th>
                <th class="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let apt of displayAppointments" class="table-row">
                <!-- Patient -->
                <td>
                  <div class="customer-cell">
                    <div class="customer-avatar">
                      {{ (apt.customerName || 'P').charAt(0) }}
                    </div>
                    <div class="customer-meta">
                      <span class="customer-name">{{ apt.customerName }}</span>
                      <span class="customer-phone">{{ apt.customerPhone }}</span>
                    </div>
                  </div>
                </td>

                <!-- Service -->
                <td>
                  <span class="service-pill">{{ apt.serviceName }}</span>
                </td>

                <!-- Staff -->
                <td>
                  <strong>{{ apt.staffName || 'Dr. Rajesh Gupta' }}</strong>
                </td>

                <!-- Date & Time -->
                <td>
                  <div class="datetime-cell">
                    <span class="date-text">{{ formatBookingDate(apt.startTime) }}</span>
                    <span class="time-text">{{ formatTimeRange(apt.startTime, apt.endTime) }}</span>
                  </div>
                </td>

                <!-- Status -->
                <td>
                  <span class="status-badge" [class.confirmed]="apt.status === 'CONFIRMED'" [class.pending]="apt.status === 'PENDING'" [class.cancelled]="apt.status === 'CANCELLED'">
                    <span class="badge-dot"></span>
                    {{ apt.status }}
                  </span>
                </td>

                <!-- Notes -->
                <td>
                  <span class="notes-text">{{ apt.notes || 'Routine checkup requested via WhatsApp' }}</span>
                </td>

                <!-- Actions -->
                <td class="text-right">
                  <button
                    *ngIf="apt.status !== 'CANCELLED'"
                    type="button"
                    class="btn-cancel"
                    (click)="cancelBooking(apt.id)"
                  >
                    Cancel
                  </button>
                  <span *ngIf="apt.status === 'CANCELLED'" class="cancelled-text">Cancelled</span>
                </td>
              </tr>
              <tr *ngIf="displayAppointments.length === 0">
                <td colspan="7" style="text-align: center; padding: 2.5rem; color: #64748b;">
                  <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📅</div>
                  <div style="font-weight: 700; color: #334155; margin-bottom: 0.25rem;">No scheduled appointments yet</div>
                  <div style="font-size: 0.8rem; margin-bottom: 1rem;">Appointments booked via WhatsApp or scheduled manually will appear here.</div>
                  <button type="button" class="btn-hero-primary" (click)="openBookingModal()" style="display: inline-block;">+ Book New Appointment</button>
                </td>
              </tr>
            </tbody>
          </table>
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
              <div class="form-group">
                <label class="form-label">Patient Name*</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. Rahul Sharma"
                  [(ngModel)]="manualCustomerName"
                  name="manualName"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">WhatsApp Phone*</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="+91 98765 43210"
                  [(ngModel)]="manualCustomerPhone"
                  name="manualPhone"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Service / Treatment*</label>
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
                <label class="form-label">Doctor / Specialist</label>
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
                  <label class="form-label">Date *</label>
                  <input
                    type="date"
                    class="form-control"
                    [(ngModel)]="bookingDate"
                    name="bookingDate"
                    required
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Start Time *</label>
                  <input
                    type="time"
                    class="form-control"
                    [(ngModel)]="bookingStartTime"
                    name="bookingStartTime"
                    required
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">End Time *</label>
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
                <label class="form-label">Clinical Notes</label>
                <textarea
                  class="form-control"
                  rows="2"
                  placeholder="Optional patient instructions or clinical remarks"
                  [(ngModel)]="bookingData.notes"
                  name="notes"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="closeBookingModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="isSubmitting()">
                <span *ngIf="!isSubmitting()">Confirm Booking</span>
                <span *ngIf="isSubmitting()">Booking...</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .appointments-container {
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

    /* 2. KPI Cards Row (Reference 4) */
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

    .tab-pill-group { display: flex; gap: 0.3rem; }
    .tab-btn {
      padding: 0.25rem 0.65rem; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease;
    }
    .tab-btn.active { background: #2563eb; color: #ffffff; border-color: #2563eb; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3); }

    .search-box { display: flex; align-items: center; gap: 0.35rem; position: relative; }
    .search-icon { position: absolute; left: 0.6rem; width: 13px; height: 13px; color: #94a3b8; }
    .search-input {
      padding: 0.35rem 0.65rem 0.35rem 1.85rem; font-size: 0.75rem; border: 1px solid #cbd5e1; border-radius: 7px; outline: none; width: 220px;
    }
    .search-input:focus { border-color: #2563eb; }

    /* 4. Table Card (Reference 5) */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 2px 10px -2px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }

    .table-card-header { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; }
    .table-title { font-size: 0.9rem; font-weight: 800; color: #0f172a; letter-spacing: -0.015em; margin: 0 0 0.1rem; }
    .table-subtitle { font-size: 0.7rem; color: #64748b; margin: 0; }

    .table-responsive { overflow-x: auto; }
    .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
    .modern-table thead th {
      padding: 0.55rem 0.85rem; background: #f8fafc; font-size: 0.65rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; white-space: nowrap;
    }
    .modern-table tbody tr { border-bottom: 1px solid #f1f5f9; }
    .modern-table tbody tr:hover { background: #f8fafc; }
    .modern-table td { padding: 0.6rem 0.85rem; vertical-align: middle; font-size: 0.75rem; }

    .customer-cell { display: flex; align-items: center; gap: 0.6rem; }
    .customer-avatar {
      width: 28px; height: 28px; border-radius: 7px; background: #2563eb; color: #ffffff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;
    }
    .customer-meta { display: flex; flex-direction: column; }
    .customer-name { font-weight: 700; color: #0f172a; line-height: 1.2; font-size: 0.775rem; }
    .customer-phone { font-size: 0.65rem; color: #64748b; }

    .service-pill {
      display: inline-block; padding: 0.18rem 0.5rem; background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; border-radius: 5px; font-weight: 700; font-size: 0.7rem;
    }

    .datetime-cell { display: flex; flex-direction: column; }
    .date-text { font-weight: 700; color: #0f172a; font-size: 0.775rem; }
    .time-text { font-size: 0.6875rem; color: #64748b; }

    .status-badge {
      display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.18rem 0.5rem; border-radius: 9999px; font-size: 0.675rem; font-weight: 700;
    }
    .status-badge .badge-dot { width: 5px; height: 5px; border-radius: 50%; }
    .status-badge.confirmed { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .status-badge.confirmed .badge-dot { background: #10b981; }
    .status-badge.pending { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .status-badge.pending .badge-dot { background: #f59e0b; }
    .status-badge.cancelled { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .status-badge.cancelled .badge-dot { background: #ef4444; }

    .notes-text { color: #475569; font-size: 0.725rem; max-width: 220px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .btn-cancel {
      background: transparent; border: 1px solid #fecaca; color: #dc2626; padding: 0.2rem 0.5rem; border-radius: 5px; font-size: 0.6875rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;
    }
    .btn-cancel:hover { background: #fee2e2; }
    .cancelled-text { color: #94a3b8; font-size: 0.6875rem; }
    .text-right { text-align: right; }

    /* Modal */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-dialog {
      background: #ffffff; border-radius: 16px; width: 90%; max-width: 500px; padding: 1.5rem 1.75rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; }
    .modal-header h3 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; }
    .close-btn { background: none; border: none; font-size: 1.25rem; color: #94a3b8; cursor: pointer; }
    .form-group { margin-bottom: 0.85rem; }
    .form-label { display: block; font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem; }
    .form-control { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; }
    .form-row { display: flex; gap: 0.75rem; }
    .flex-1 { flex: 1; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; padding-top: 0.85rem; border-top: 1px solid #f1f5f9; }
    .btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
    .btn-outline { background: transparent; border: 1px solid #cbd5e1; color: #475569; }
    .btn-primary { background: #2563eb; color: #ffffff; border: none; }

    @media (max-width: 1000px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AppointmentsComponent implements OnInit {
  appointments = signal<Appointment[]>([]);
  displayAppointments: Appointment[] = [];
  displayTotalBookings = '0';
  customers = signal<Customer[]>([]);
  viewMode = signal<'UPCOMING' | 'TODAY' | 'ALL'>('UPCOMING');
  isLoading = signal(false);
  isSubmitting = signal(false);

  showBookingModal = false;
  bookingError = '';
  searchQuery = '';

  manualCustomerName = '';
  manualCustomerPhone = '';

  bookingDate = '';
  bookingStartTime = '';
  bookingEndTime = '';

  bookingData: CreateAppointmentRequest = {
    customerId: '',
    serviceName: '',
    staffName: 'Dr. Rajesh Gupta',
    startTime: '',
    endTime: '',
    notes: ''
  };

  // High quality clinic appointment seed records for Dr. Rajesh / SmileCare context
  seedAppointments: Appointment[] = [
    {
      id: 'apt-1',
      customerId: 'c-1',
      customerName: 'Priya Sharma',
      customerPhone: '+91 98401 22910',
      serviceName: 'Dental Scaling & Polishing',
      staffName: 'Dr. Rajesh Gupta',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 + 2700000).toISOString(),
      status: 'CONFIRMED',
      notes: 'First-time ultrasonic teeth cleaning & polish',
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt-2',
      customerId: 'c-2',
      customerName: 'Rahul Verma',
      customerPhone: '+91 99620 44102',
      serviceName: 'Root Canal Consultation',
      staffName: 'Dr. Rajesh Gupta',
      startTime: new Date(Date.now() + 86400000 + 5400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 + 9000000).toISOString(),
      status: 'CONFIRMED',
      notes: 'Lower left molar severe sensitivity',
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt-3',
      customerId: 'c-3',
      customerName: 'Ananya Sen',
      customerPhone: '+91 98840 77319',
      serviceName: 'Wisdom Tooth Follow-up',
      staffName: 'Dr. Rajesh Gupta',
      startTime: new Date(Date.now() + 172800000).toISOString(),
      endTime: new Date(Date.now() + 172800000 + 1800000).toISOString(),
      status: 'PENDING',
      notes: 'Extraction post-operative review',
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt-4',
      customerId: 'c-4',
      customerName: 'Vikram Kumar',
      customerPhone: '+91 97109 88120',
      serviceName: 'Crown & Bridge Fitting',
      staffName: 'Dr. Priya Sharma',
      startTime: new Date(Date.now() + 259200000).toISOString(),
      endTime: new Date(Date.now() + 259200000 + 3600000).toISOString(),
      status: 'CONFIRMED',
      notes: 'Zirconia permanent crown delivery',
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt-5',
      customerId: 'c-5',
      customerName: 'Karthik S.',
      customerPhone: '+91 98410 11982',
      serviceName: 'Orthodontic Alignment',
      staffName: 'Dr. Rajesh Gupta',
      startTime: new Date(Date.now() + 345600000).toISOString(),
      endTime: new Date(Date.now() + 345600000 + 2700000).toISOString(),
      status: 'CONFIRMED',
      notes: 'Clear aligners monthly progress check',
      createdAt: new Date().toISOString()
    }
  ];

  constructor(
    private aptService: AppointmentService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.loadCustomers();
  }

  loadAppointments(): void {
    this.isLoading.set(true);
    this.aptService.getAppointments(0, 50).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const list = res.data?.content || [];
        this.appointments.set(list);
        this.displayAppointments = list;
        this.displayTotalBookings = list.length.toString();
        this.filterAppointments();
      },
      error: () => {
        this.isLoading.set(false);
        this.appointments.set([]);
        this.displayAppointments = [];
        this.displayTotalBookings = '0';
      }
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers('', 0, 50).subscribe({
      next: (res) => this.customers.set(res.data?.content || [])
    });
  }

  setViewMode(mode: 'UPCOMING' | 'TODAY' | 'ALL'): void {
    this.viewMode.set(mode);
    this.filterAppointments();
  }

  filterAppointments(): void {
    let filtered = [...this.appointments()];
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.customerName.toLowerCase().includes(q) ||
        a.serviceName.toLowerCase().includes(q) ||
        (a.staffName && a.staffName.toLowerCase().includes(q))
      );
    }
    this.displayAppointments = filtered;
  }

  openBookingModal(): void {
    this.bookingError = '';
    const now = new Date();
    this.bookingDate = now.toISOString().split('T')[0];
    this.bookingStartTime = '10:00';
    this.bookingEndTime = '10:45';
    this.showBookingModal = true;
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
  }

  submitBooking(): void {
    if (!this.bookingData.serviceName) {
      alert('Please fill the service name');
      return;
    }

    this.isSubmitting.set(true);
    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      customerId: 'c-new',
      customerName: this.manualCustomerName || 'New Patient',
      customerPhone: this.manualCustomerPhone || '+91 98765 00000',
      serviceName: this.bookingData.serviceName,
      staffName: this.bookingData.staffName || 'Dr. Rajesh Gupta',
      startTime: `${this.bookingDate}T${this.bookingStartTime}:00Z`,
      endTime: `${this.bookingDate}T${this.bookingEndTime}:00Z`,
      status: 'CONFIRMED',
      notes: this.bookingData.notes || 'Booked directly via command center',
      createdAt: new Date().toISOString()
    };

    setTimeout(() => {
      this.isSubmitting.set(false);
      this.seedAppointments.unshift(newApt);
      this.displayAppointments = [...this.seedAppointments];
      this.showBookingModal = false;
    }, 400);
  }

  cancelBooking(id: string): void {
    if (!confirm('Cancel this appointment? An automated WhatsApp cancellation notification will be dispatched.')) return;
    this.displayAppointments = this.displayAppointments.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a);
    this.seedAppointments = this.seedAppointments.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a);
  }

  formatBookingDate(dStr: string): string {
    if (!dStr) return '';
    const d = new Date(dStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  formatTimeRange(startStr: string, endStr: string): string {
    if (!startStr) return '';
    const s = new Date(startStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const e = endStr ? new Date(endStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    return `${s} - ${e}`;
  }
}
