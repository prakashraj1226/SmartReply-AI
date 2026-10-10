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

export interface ReportsSummary {
  totalConversations: number;
  openConversations: number;
  pendingConversations: number;
  resolvedConversations: number;
  resolutionRatePercentage: number;
  aiHandledConversations: number;
  humanHandledConversations: number;
  aiAutomationRatePercentage: number;
  avgResponseTimeSeconds: number;
  totalAppointments: number;
  confirmedAppointments: number;
  totalCustomers: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getSummary(period = '30_DAYS'): Observable<ApiResponse<ReportsSummary>> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ApiResponse<ReportsSummary>>(`${this.apiUrl}/summary`, { params });
  }

  downloadCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-csv`, { responseType: 'blob' });
  }
}
