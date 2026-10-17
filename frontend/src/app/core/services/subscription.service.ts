import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  referenceCode?: string;
  utr?: string;
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
  trialStartedAt?: string;
  trialEndsAt?: string;
  trialStatus?: string;
  isTrial?: boolean;
  isTrialExpired?: boolean;
  daysRemaining?: number;
  staffCount?: number;
  staffLimit?: number;
  customerCount?: number;
  customerLimit?: number;
  knowledgeCount?: number;
  knowledgeLimit?: number;
  faqCount?: number;
  faqLimit?: number;
  aiTodayChats?: number;
  aiTodayLimit?: number;
  appointmentTodayCount?: number;
  appointmentTodayLimit?: number;
  appointmentTotalCount?: number;
  appointmentTotalLimit?: number;
  geminiRepliesToday?: number;
  geminiRepliesDailyLimit?: number;
  geminiRepliesMonth?: number;
  geminiRepliesMonthlyLimit?: number;
}

export interface CheckoutOrder {
  orderId: string;
  planCode: string;
  amountInr: number;
  keyId: string;
  simulated: boolean;
  referenceCode: string;
  amountDueInr: number;
}

export interface VerifyPaymentRequest {
  planCode: string;
  orderId: string;
  paymentId: string;
  signature?: string;
  isSimulated?: boolean;
  paymentMethod?: string;
  upiId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = `${environment.apiUrl}/subscriptions`;

  currentSubscription = signal<SubscriptionDetails | null>(null);

  constructor(private http: HttpClient) {}

  getPlans(): Observable<ApiResponse<SubscriptionPlan[]>> {
    return this.http.get<ApiResponse<SubscriptionPlan[]>>(`${this.apiUrl}/plans`);
  }

  getCurrentSubscription(): Observable<ApiResponse<SubscriptionDetails>> {
    return this.http.get<ApiResponse<SubscriptionDetails>>(`${this.apiUrl}/current`).pipe(
      tap(res => {
        if (res.success && res.data) {
          const d = res.data;
          d.isTrial = !!(d.isTrial || (d as any).trial || d.planCode === 'TRIAL' || d.planCode === 'FREE' || d.status === 'TRIALING');
          d.isTrialExpired = !!(d.isTrialExpired || (d as any).trialExpired || d.trialStatus === 'EXPIRED');
          this.currentSubscription.set(d);
        }
      })
    );
  }

  refreshSubscription(): void {
    this.getCurrentSubscription().subscribe({
      error: () => {}
    });
  }

  createCheckoutOrder(planCode: string): Observable<ApiResponse<CheckoutOrder>> {
    return this.http.post<ApiResponse<CheckoutOrder>>(`${this.apiUrl}/checkout`, { planCode });
  }

  verifyPayment(req: VerifyPaymentRequest): Observable<ApiResponse<SubscriptionDetails>> {
    return this.http.post<ApiResponse<SubscriptionDetails>>(`${this.apiUrl}/verify`, req).pipe(
      tap(res => {
        if (res.success && res.data) {
          const d = res.data;
          d.isTrial = !!(d.isTrial || (d as any).trial || d.planCode === 'TRIAL' || d.planCode === 'FREE' || d.status === 'TRIALING');
          d.isTrialExpired = !!(d.isTrialExpired || (d as any).trialExpired || d.trialStatus === 'EXPIRED');
          this.currentSubscription.set(d);
        }
      })
    );
  }

  cancelSubscription(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/cancel`, {});
  }
}
