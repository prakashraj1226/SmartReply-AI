import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Business } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  private readonly baseUrl = `${environment.apiUrl}/business`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ApiResponse<Business>> {
    return this.http.get<ApiResponse<Business>>(`${this.baseUrl}/profile`);
  }

  updateProfile(profile: Partial<Business>): Observable<ApiResponse<Business>> {
    return this.http.put<ApiResponse<Business>>(`${this.baseUrl}/profile`, profile);
  }

  getChecklist(): Observable<ApiResponse<{ [key: string]: boolean }>> {
    return this.http.get<ApiResponse<{ [key: string]: boolean }>>(`${this.baseUrl}/checklist`);
  }
}
