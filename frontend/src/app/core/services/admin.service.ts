import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';

export interface AdminOverview {
  totalBusinesses: number;
  activeBusinesses: number;
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  estimatedMrrInr: number;
  activeIntegrations: number;
}

export interface AdminBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  email: string;
  phone: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  planName: string;
  memberCount: number;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  businessName: string;
  createdAt: string;
}

export interface PendingPayment {
  id: string;
  businessName: string;
  planName: string;
  planCode: string;
  amountInr: number;
  referenceCode: string;
  utr: string;
  upiId: string;
  status: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  businessName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  detailsJson: string;
  ipAddress: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<ApiResponse<AdminOverview>> {
    return this.http.get<ApiResponse<AdminOverview>>(`${this.baseUrl}/overview`);
  }

  getBusinesses(): Observable<ApiResponse<AdminBusiness[]>> {
    return this.http.get<ApiResponse<AdminBusiness[]>>(`${this.baseUrl}/businesses`);
  }

  updateBusinessStatus(id: string, active: boolean): Observable<ApiResponse<AdminBusiness>> {
    return this.http.patch<ApiResponse<AdminBusiness>>(`${this.baseUrl}/businesses/${id}/status`, { active });
  }

  getUsers(): Observable<ApiResponse<AdminUser[]>> {
    return this.http.get<ApiResponse<AdminUser[]>>(`${this.baseUrl}/users`);
  }

  getAuditLogs(): Observable<ApiResponse<AuditLogItem[]>> {
    return this.http.get<ApiResponse<AuditLogItem[]>>(`${this.baseUrl}/audit-logs`);
  }

  getPendingPayments(): Observable<ApiResponse<PendingPayment[]>> {
    return this.http.get<ApiResponse<PendingPayment[]>>(`${this.baseUrl}/payments/pending`);
  }

  confirmPayment(id: string): Observable<ApiResponse<PendingPayment>> {
    return this.http.post<ApiResponse<PendingPayment>>(`${this.baseUrl}/payments/${id}/confirm`, {});
  }

  rejectPayment(id: string): Observable<ApiResponse<PendingPayment>> {
    return this.http.post<ApiResponse<PendingPayment>>(`${this.baseUrl}/payments/${id}/reject`, {});
  }
}
