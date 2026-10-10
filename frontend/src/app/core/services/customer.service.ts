import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';

export interface Customer {
  id: string;
  businessId: string;
  phoneNumber: string;
  name: string;
  email: string;
  optInStatus: string;
  tagsJson: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly baseUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  getCustomers(query?: string, page: number = 0, size: number = 20): Observable<ApiResponse<PagedResult<Customer>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (query && query.trim()) {
      params = params.set('query', query.trim());
    }
    return this.http.get<ApiResponse<PagedResult<Customer>>>(this.baseUrl, { params });
  }

  getCustomer(id: string): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.baseUrl}/${id}`);
  }

  createCustomer(payload: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.baseUrl, payload);
  }

  updateCustomer(id: string, payload: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.baseUrl}/${id}`, payload);
  }

  deleteCustomer(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export`, { responseType: 'blob' });
  }
}
