import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface ConversationDto {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  aiEnabled: boolean;
  unreadCount: number;
  assignedAgentId?: string;
  assignedAgentName?: string;
  lastMessageSnippet?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'AI' | 'SYSTEM';
  textContent: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  externalMessageId?: string;
  createdAt: string;
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
export class InboxService {
  private apiUrl = '/api/conversations';

  constructor(private http: HttpClient) {}

  getConversations(status?: string, query?: string, page = 0, size = 30): Observable<ApiResponse<PageResult<ConversationDto>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }
    if (query && query.trim()) {
      params = params.set('query', query.trim());
    }

    return this.http.get<ApiResponse<PageResult<ConversationDto>>>(this.apiUrl, { params });
  }

  getConversationById(id: string): Observable<ApiResponse<ConversationDto>> {
    return this.http.get<ApiResponse<ConversationDto>>(`${this.apiUrl}/${id}`);
  }

  getMessages(conversationId: string): Observable<ApiResponse<MessageDto[]>> {
    return this.http.get<ApiResponse<MessageDto[]>>(`${this.apiUrl}/${conversationId}/messages`);
  }

  sendAgentReply(conversationId: string, textContent: string): Observable<ApiResponse<MessageDto>> {
    return this.http.post<ApiResponse<MessageDto>>(`${this.apiUrl}/${conversationId}/messages`, { textContent });
  }

  simulateIncomingMessage(customerId: string, textContent: string): Observable<ApiResponse<MessageDto>> {
    return this.http.post<ApiResponse<MessageDto>>(`${this.apiUrl}/simulate-incoming`, { customerId, textContent });
  }

  updateStatus(conversationId: string, status: string): Observable<ApiResponse<ConversationDto>> {
    return this.http.patch<ApiResponse<ConversationDto>>(`${this.apiUrl}/${conversationId}/status`, { status });
  }

  toggleAi(conversationId: string): Observable<ApiResponse<ConversationDto>> {
    return this.http.patch<ApiResponse<ConversationDto>>(`${this.apiUrl}/${conversationId}/ai-toggle`, {});
  }

  assignAgent(conversationId: string, agentUserId?: string): Observable<ApiResponse<ConversationDto>> {
    return this.http.patch<ApiResponse<ConversationDto>>(`${this.apiUrl}/${conversationId}/assign`, { agentUserId: agentUserId || null });
  }

  markAsRead(conversationId: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${conversationId}/read`, {});
  }

  getSuggestions(conversationId: string, lastMessage?: string): Observable<ApiResponse<string[]>> {
    let params = new HttpParams();
    if (lastMessage) {
      params = params.set('lastMessage', lastMessage);
    }
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/${conversationId}/suggestions`, { params });
  }
}
