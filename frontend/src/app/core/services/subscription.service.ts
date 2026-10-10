import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  priceInr: number;
  billingInterval: string;
  maxConversationsMonthly: number;
  maxAgents: number;
  aiFeaturesEnabled: boolean;
  featuresJson?: string;
}

export interface PaymentTransaction {
  id: string;
  planName: string;
  gateway: string;
  paymentId?: string;
  amountInr: number;
  status: string;
  createdAt: string;
}

export interface SubscriptionDetails {
  id: string;
  planCode: string;
  planName: string;
  priceInr: number;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  maxConversationsMonthly: number;
  maxAgents: number;
  aiFeaturesEnabled: boolean;
  currentMonthConversations: number;
  remainingConversations: number;
  transactions: PaymentTransaction[];
}

export interface CheckoutOrder {
  orderId: string;
  planCode: string;
  amountInr: number;
  keyId: string;
  simulated: boolean;
}

export interface VerifyPaymentRequest {
  planCode: string;
  orderId: string;
  paymentId: string;
  signature?: string;
  isSimulated?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = '/api/subscriptions';

  constructor(private http: HttpClient) {}

  getPlans(): Observable<ApiResponse<SubscriptionPlan[]>> {
    return this.http.get<ApiResponse<SubscriptionPlan[]>>(`${this.apiUrl}/plans`);
  }

  getCurrentSubscription(): Observable<ApiResponse<SubscriptionDetails>> {
    return this.http.get<ApiResponse<SubscriptionDetails>>(`${this.apiUrl}/current`);
  }

  createCheckoutOrder(planCode: string): Observable<ApiResponse<CheckoutOrder>> {
    return this.http.post<ApiResponse<CheckoutOrder>>(`${this.apiUrl}/checkout`, { planCode });
  }

  verifyPayment(req: VerifyPaymentRequest): Observable<ApiResponse<SubscriptionDetails>> {
    return this.http.post<ApiResponse<SubscriptionDetails>>(`${this.apiUrl}/verify`, req);
  }

  cancelSubscription(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/cancel`, {});
  }
}
