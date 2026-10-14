import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';

export interface AssistantTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface AssistantStatus {
  configured: boolean;
  model: string;
  provider: string;
}

export interface AssistantChatResponse {
  reply: string;
  model: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private readonly baseUrl = `${environment.apiUrl}/assistant`;
  readonly panelOpen = signal(false);

  constructor(private http: HttpClient) {}

  togglePanel(): void {
    this.panelOpen.update(open => !open);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  status(): Observable<ApiResponse<AssistantStatus>> {
    return this.http.get<ApiResponse<AssistantStatus>>(`${this.baseUrl}/status`);
  }

  chat(message: string, history: AssistantTurn[]): Observable<ApiResponse<AssistantChatResponse>> {
    return this.http.post<ApiResponse<AssistantChatResponse>>(`${this.baseUrl}/chat`, { message, history });
  }
}
