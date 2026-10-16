import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface TelegramConfig {
  id: string;
  botUsername?: string;
  botDisplayName?: string;
  webhookVerifyToken?: string;
  status: 'CONNECTED' | 'SANDBOX' | 'DISCONNECTED' | 'ERROR';
  sandbox: boolean;
  hasToken: boolean;
  maskedToken?: string;
  webhookUrl: string;
  autoReplyCount?: number;
}

export interface AutoReplyResult {
  customerMessage: string;
  replyText: string;
  simulated: boolean;
}

export interface UpdateTelegramConfigRequest {
  botToken?: string;
  isSandbox?: boolean;
  webhookSecret?: string;
}

export interface TelegramSendResult {
  success: boolean;
  messageId?: string;
  status: string;
  errorMessage?: string;
  simulated: boolean;
}

export interface SimulateTelegramRequest {
  text: string;
  fromUserId?: string;
  senderName?: string;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TelegramService {
  private apiUrl = `${environment.apiUrl}/telegram`;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<ApiResponse<TelegramConfig>> {
    return this.http.get<ApiResponse<TelegramConfig>>(`${this.apiUrl}/config`);
  }

  updateConfig(req: UpdateTelegramConfigRequest): Observable<ApiResponse<TelegramConfig>> {
    return this.http.put<ApiResponse<TelegramConfig>>(`${this.apiUrl}/config`, req);
  }

  simulateWebhook(req: SimulateTelegramRequest): Observable<ApiResponse<AutoReplyResult>> {
    return this.http.post<ApiResponse<AutoReplyResult>>(`${this.apiUrl}/simulate`, req);
  }

  testSend(chatId: string, message: string): Observable<ApiResponse<TelegramSendResult>> {
    return this.http.post<ApiResponse<TelegramSendResult>>(`${this.apiUrl}/test-send`, {
      chatId,
      message
    });
  }
}
