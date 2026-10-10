import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse, UserProfile } from '../models/auth.models';

const TOKEN_KEY = 'sr_token';
const USER_KEY = 'sr_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private tokenSignal = signal<string | null>(this.getStoredToken());
  private currentUserSignal = signal<UserProfile | null>(this.getStoredUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly isBusinessOwner = computed(() => this.currentUserSignal()?.role === 'BUSINESS_OWNER');
  readonly isSuperAdmin = computed(() => this.currentUserSignal()?.role === 'SUPER_ADMIN');
  readonly onboardingCompleted = computed(() => !!this.currentUserSignal()?.onboardingCompleted);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  register(payload: any): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/register`, payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  fetchProfile(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.baseUrl}/me`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentUserSignal.set(res.data);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  updateOnboardingStatus(completed: boolean): void {
    const current = this.currentUserSignal();
    if (current) {
      const updated = { ...current, onboardingCompleted: completed };
      this.currentUserSignal.set(updated);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
  }

  private setSession(auth: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, auth.token);
    const profile: UserProfile = {
      id: auth.userId,
      email: auth.email,
      fullName: auth.fullName,
      role: auth.role,
      businessId: auth.businessId,
      businessName: auth.businessName,
      onboardingCompleted: auth.onboardingCompleted
    };
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    this.tokenSignal.set(auth.token);
    this.currentUserSignal.set(profile);
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  private getStoredUser(): UserProfile | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
