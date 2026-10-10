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
  serviceName: string;
  staffName?: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  customerId: string;
  serviceName: string;
  staffName?: string;
  startTime: string;
  endTime: string;
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

  createAppointment(req: CreateAppointmentRequest): Observable<ApiResponse<Appointment>> {
    return this.http.post<ApiResponse<Appointment>>(this.apiUrl, req);
  }

  updateAppointment(id: string, req: UpdateAppointmentRequest): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.apiUrl}/${id}`, req);
  }

  cancelAppointment(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
