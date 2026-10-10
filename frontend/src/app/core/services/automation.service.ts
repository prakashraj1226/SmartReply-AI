import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerEvent: string;
  conditionsJson: string;
  actionsJson: string;
  active: boolean;
  createdAt: string;
}

export interface CreateAutomationRuleRequest {
  name: string;
  triggerEvent: string;
  conditionsJson?: string;
  actionsJson: string;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerEvent: string;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  executedAt: string;
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
export class AutomationService {
  private apiUrl = '/api/automations';

  constructor(private http: HttpClient) {}

  getRules(): Observable<ApiResponse<AutomationRule[]>> {
    return this.http.get<ApiResponse<AutomationRule[]>>(`${this.apiUrl}/rules`);
  }

  createRule(req: CreateAutomationRuleRequest): Observable<ApiResponse<AutomationRule>> {
    return this.http.post<ApiResponse<AutomationRule>>(`${this.apiUrl}/rules`, req);
  }

  updateRule(id: string, req: CreateAutomationRuleRequest): Observable<ApiResponse<AutomationRule>> {
    return this.http.put<ApiResponse<AutomationRule>>(`${this.apiUrl}/rules/${id}`, req);
  }

  toggleRule(id: string): Observable<ApiResponse<AutomationRule>> {
    return this.http.patch<ApiResponse<AutomationRule>>(`${this.apiUrl}/rules/${id}/toggle`, {});
  }

  deleteRule(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/rules/${id}`);
  }

  getExecutions(page = 0, size = 20): Observable<ApiResponse<PageResult<AutomationExecution>>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<PageResult<AutomationExecution>>>(`${this.apiUrl}/executions`, { params });
  }
}
