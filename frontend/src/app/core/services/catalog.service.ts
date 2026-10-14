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

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  address?: string;
  phone?: string;
  timezone: string;
  active: boolean;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  businessId: string;
  branchId?: string;
  branchName?: string;
  name: string;
  category?: string;
  description?: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  price: number;
  currency: string;
  active: boolean;
  createdAt: string;
}

export interface StaffServiceSummary {
  id: string;
  name: string;
  category?: string;
}

export interface StaffMember {
  id: string;
  businessId: string;
  userId?: string;
  branchId?: string;
  branchName?: string;
  name: string;
  staffType: string;
  phone?: string;
  email?: string;
  active: boolean;
  assignedServices: StaffServiceSummary[];
  createdAt: string;
}

export interface StaffAvailability {
  id: string;
  staffId: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  active: boolean;
}

export interface StaffLeave {
  id: string;
  staffId: string;
  leaveDate: string;
  reason?: string;
  status: string;
  createdAt: string;
}

export interface IndustryTemplate {
  id: string;
  title: string;
  description: string;
  sampleServices: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // --- Branches ---
  getBranches(activeOnly = true): Observable<ApiResponse<Branch[]>> {
    const params = new HttpParams().set('activeOnly', activeOnly.toString());
    return this.http.get<ApiResponse<Branch[]>>(`${this.baseUrl}/branches`, { params });
  }

  createBranch(req: { name: string; address?: string; phone?: string; timezone?: string }): Observable<ApiResponse<Branch>> {
    return this.http.post<ApiResponse<Branch>>(`${this.baseUrl}/branches`, req);
  }

  // --- Services ---
  getServices(branchId?: string, category?: string, activeOnly = true): Observable<ApiResponse<ServiceItem[]>> {
    let params = new HttpParams().set('activeOnly', activeOnly.toString());
    if (branchId) params = params.set('branchId', branchId);
    if (category) params = params.set('category', category);
    return this.http.get<ApiResponse<ServiceItem[]>>(`${this.baseUrl}/services`, { params });
  }

  getCategories(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/services/categories`);
  }

  createService(req: Partial<ServiceItem>): Observable<ApiResponse<ServiceItem>> {
    return this.http.post<ApiResponse<ServiceItem>>(`${this.baseUrl}/services`, req);
  }

  // --- Staff ---
  getStaff(branchId?: string, staffType?: string, serviceId?: string, activeOnly = true): Observable<ApiResponse<StaffMember[]>> {
    let params = new HttpParams().set('activeOnly', activeOnly.toString());
    if (branchId) params = params.set('branchId', branchId);
    if (staffType) params = params.set('staffType', staffType);
    if (serviceId) params = params.set('serviceId', serviceId);
    return this.http.get<ApiResponse<StaffMember[]>>(`${this.baseUrl}/staff`, { params });
  }

  createStaff(req: { name: string; staffType?: string; phone?: string; email?: string; branchId?: string; serviceIds?: string[] }): Observable<ApiResponse<StaffMember>> {
    return this.http.post<ApiResponse<StaffMember>>(`${this.baseUrl}/staff`, req);
  }

  getStaffAvailability(staffId: string): Observable<ApiResponse<StaffAvailability[]>> {
    return this.http.get<ApiResponse<StaffAvailability[]>>(`${this.baseUrl}/staff/${staffId}/availability`);
  }

  saveStaffAvailability(staffId: string, shifts: Partial<StaffAvailability>[]): Observable<ApiResponse<StaffAvailability[]>> {
    return this.http.put<ApiResponse<StaffAvailability[]>>(`${this.baseUrl}/staff/${staffId}/availability`, shifts);
  }

  getStaffLeaves(staffId: string): Observable<ApiResponse<StaffLeave[]>> {
    return this.http.get<ApiResponse<StaffLeave[]>>(`${this.baseUrl}/staff/${staffId}/leaves`);
  }

  createStaffLeave(staffId: string, req: { leaveDate: string; reason?: string }): Observable<ApiResponse<StaffLeave>> {
    return this.http.post<ApiResponse<StaffLeave>>(`${this.baseUrl}/staff/${staffId}/leaves`, req);
  }

  // --- Onboarding Templates ---
  getTemplates(): Observable<ApiResponse<IndustryTemplate[]>> {
    return this.http.get<ApiResponse<IndustryTemplate[]>>(`${this.baseUrl}/business/onboarding/templates`);
  }

  applyTemplate(industryType: string, branchName?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/business/onboarding/apply-template`, { industryType, branchName });
  }
}
