import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, DashboardStats } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(range: string = 'last_7_days'): Observable<ApiResponse<DashboardStats>> {
    const params = new HttpParams().set('range', range);
    return this.http.get<ApiResponse<DashboardStats>>(`${this.baseUrl}/stats`, { params });
  }
}
