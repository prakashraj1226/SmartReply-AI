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

export interface WhatsAppConfig {
  id: string;
  accountId?: string;
  phoneNumberId?: string;
  phoneNumber?: string;
  webhookVerifyToken?: string;
  status: 'CONNECTED' | 'SANDBOX' | 'DISCONNECTED' | 'ERROR';
  sandbox: boolean;
  hasAccessToken: boolean;
  webhookCallbackUrl: string;
  autoReplyCount?: number;
}

export interface AutoReplyResult {
  customerMessage: string;
  replyText: string;
  simulated: boolean;
}

export interface UpdateWhatsAppConfigRequest {
  accountId?: string;
  phoneNumberId?: string;
  phoneNumber?: string;
  accessToken?: string;
  webhookVerifyToken?: string;
  appSecret?: string;
  isSandbox?: boolean;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  status: string;
  errorMessage?: string;
  simulated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  private apiUrl = `${environment.apiUrl}/whatsapp`;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<ApiResponse<WhatsAppConfig>> {
    return this.http.get<ApiResponse<WhatsAppConfig>>(`${this.apiUrl}/config`);
  }

  updateConfig(req: UpdateWhatsAppConfigRequest): Observable<ApiResponse<WhatsAppConfig>> {
    return this.http.put<ApiResponse<WhatsAppConfig>>(`${this.apiUrl}/config`, req);
  }

  testSend(recipientPhone: string, message: string): Observable<ApiResponse<WhatsAppSendResult>> {
    return this.http.post<ApiResponse<WhatsAppSendResult>>(`${this.apiUrl}/test-send`, {
      recipientPhone,
      message
    });
  }

  simulateWebhook(fromPhone: string, text: string, senderName: string): Observable<ApiResponse<AutoReplyResult>> {
    return this.http.post<ApiResponse<AutoReplyResult>>(`${this.apiUrl}/simulate-webhook`, {
      fromPhone,
      text,
      senderName
    });
  }
}
