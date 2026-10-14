import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  branchId?: string;
  branchName?: string;
  serviceId?: string;
  serviceName: string;
  staffId?: string;
  staffName?: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'PENDING';
  bookingSource?: string;
  notes?: string;
  createdByUserId?: string;
  createdByName?: string;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  branchId?: string;
  serviceId?: string;
  serviceName?: string;
  staffId?: string;
  staffName?: string;
  startTime: string;
  endTime?: string;
  bookingSource?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  serviceName?: string;
  staffName?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  notes?: string;
}

export interface UpdateAppointmentStatusRequest {
  status: string;
  notes?: string;
}

export interface AvailableStaffSummary {
  staffId: string;
  staffName: string;
  staffType: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  timeFormatted: string;
  available: boolean;
  availableStaff: AvailableStaffSummary[];
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient) {}

  getAppointments(page = 0, size = 20): Observable<ApiResponse<PageResult<Appointment>>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<PageResult<Appointment>>>(this.apiUrl, { params });
  }

  getAppointmentsCalendar(start: string, end: string): Observable<ApiResponse<Appointment[]>> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<ApiResponse<Appointment[]>>(`${this.apiUrl}/calendar`, { params });
  }

  getAvailableSlots(date: string, serviceId?: string, staffId?: string, branchId?: string): Observable<ApiResponse<TimeSlot[]>> {
    let params = new HttpParams().set('date', date);
    if (serviceId) params = params.set('serviceId', serviceId);
    if (staffId) params = params.set('staffId', staffId);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<TimeSlot[]>>(`${this.apiUrl}/available-slots`, { params });
  }

  createAppointment(req: CreateAppointmentRequest): Observable<ApiResponse<Appointment>> {
    return this.http.post<ApiResponse<Appointment>>(this.apiUrl, req);
  }

  updateAppointment(id: string, req: UpdateAppointmentRequest): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.apiUrl}/${id}`, req);
  }

  updateStatus(id: string, status: string, notes?: string): Observable<ApiResponse<Appointment>> {
    return this.http.patch<ApiResponse<Appointment>>(`${this.apiUrl}/${id}/status`, { status, notes });
  }

  cancelAppointment(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
