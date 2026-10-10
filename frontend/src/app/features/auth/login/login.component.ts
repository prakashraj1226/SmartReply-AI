import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <!-- Brand Header -->
        <div class="auth-brand">
          <div class="brand-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M8 10h.01"></path>
              <path d="M12 10h.01"></path>
              <path d="M16 10h.01"></path>
            </svg>
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to manage your WhatsApp AI assistant & enquiries</p>
        </div>

        <!-- Alert Error Message -->
        <div class="alert alert-danger" *ngIf="errorMessage">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Form Card -->
        <div class="card auth-card">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label" for="email">Work Email</label>
              <input
                id="email"
                type="email"
                class="form-input"
                [class.error]="isFieldInvalid('email')"
                formControlName="email"
                placeholder="name@business.com"
                autocomplete="email"
              />
              <div class="field-error" *ngIf="isFieldInvalid('email')">
                Please enter a valid email address
              </div>
            </div>

            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for="password">Password</label>
                <a class="forgot-link" href="javascript:void(0)" (click)="showForgotNotice()">Forgot password?</a>
              </div>
              <input
                id="password"
                type="password"
                class="form-input"
                [class.error]="isFieldInvalid('password')"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <div class="field-error" *ngIf="isFieldInvalid('password')">
                Password is required
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="loginForm.invalid || isLoading">
              <span *ngIf="!isLoading">Sign In to Dashboard</span>
              <span *ngIf="isLoading" class="spinner-text">
                <svg class="spinner" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            </button>
          </form>

          <!-- Quick Test Demo Credentials -->
          <div class="demo-box">
            <span class="demo-title">Test Account Pre-fill:</span>
            <button type="button" class="btn-demo" (click)="fillDemo('rajesh@smilecare.com', 'password123')">
              Dr. Rajesh (SmileCare Dental)
            </button>
          </div>
        </div>

        <!-- Auth Footer -->
        <div class="auth-footer">
          Don't have an account?
          <a routerLink="/auth/register" class="register-link">Start 14-day free trial</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 20%, #f1f5f9 0%, #e2e8f0 100%);
      padding: 2rem 1rem;
    }

    .auth-container {
      width: 100%;
      max-width: 440px;
    }

    .auth-brand {
      text-align: center;
      margin-bottom: 2rem;
    }

    .brand-badge {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      border-radius: 14px;
      margin: 0 auto 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
    }

    .brand-badge svg {
      width: 26px;
      height: 26px;
    }

    .auth-brand h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--slate-900);
      margin-bottom: 0.5rem;
    }

    .auth-brand p {
      font-size: 0.875rem;
      color: var(--slate-600);
    }

    .auth-card {
      padding: 2rem;
      background: #ffffff;
      border: 1px solid var(--slate-200);
      box-shadow: var(--shadow-lg);
    }

    .label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .forgot-link {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-600);
      text-decoration: none;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }

    .btn-block {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.9375rem;
      margin-top: 0.75rem;
    }

    .spinner-text {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .spinner {
      width: 16px;
      height: 16px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .demo-box {
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px dashed var(--slate-200);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .demo-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-500);
    }

    .btn-demo {
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      color: var(--slate-700);
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;
    }

    .btn-demo:hover {
      background: var(--slate-200);
      color: var(--slate-900);
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--slate-600);
    }

    .register-link {
      color: var(--primary-600);
      font-weight: 700;
      text-decoration: none;
      margin-left: 0.375rem;
    }

    .register-link:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  isLoading = false;
  errorMessage = '';

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  fillDemo(email: string, pass: string) {
    this.loginForm.patchValue({ email, password: pass });
  }

  showForgotNotice() {
    alert('For security in production, reset link is sent to registered email. For development testing, you can register a new account or use demo credentials.');
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data?.onboardingCompleted) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/onboarding']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid email or password. Please try again.';
      }
    });
  }
}
