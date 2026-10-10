import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
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
          <h1>Create your business account</h1>
          <p>Automate WhatsApp enquiries & appointments with SmartReply AI</p>
        </div>

        <!-- Error Message -->
        <div class="alert alert-danger" *ngIf="errorMessage">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Register Card -->
        <div class="card auth-card">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label" for="fullName">Your Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  class="form-input"
                  [class.error]="isFieldInvalid('fullName')"
                  formControlName="fullName"
                  placeholder="e.g. Dr. Priya Sharma"
                />
                <div class="field-error" *ngIf="isFieldInvalid('fullName')">Name is required</div>
              </div>

              <div class="form-group flex-1">
                <label class="form-label" for="phone">Phone / WhatsApp</label>
                <input
                  id="phone"
                  type="text"
                  class="form-input"
                  formControlName="phone"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="businessName">Business Name</label>
              <input
                id="businessName"
                type="text"
                class="form-input"
                [class.error]="isFieldInvalid('businessName')"
                formControlName="businessName"
                placeholder="e.g. Apex Dental & Aesthetic Clinic"
              />
              <div class="field-error" *ngIf="isFieldInvalid('businessName')">Business name is required</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="email">Work Email</label>
              <input
                id="email"
                type="email"
                class="form-input"
                [class.error]="isFieldInvalid('email')"
                formControlName="email"
                placeholder="priya@apexdental.com"
                autocomplete="email"
              />
              <div class="field-error" *ngIf="isFieldInvalid('email')">Valid email is required</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Password (min 6 characters)</label>
              <input
                id="password"
                type="password"
                class="form-input"
                [class.error]="isFieldInvalid('password')"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="new-password"
              />
              <div class="field-error" *ngIf="isFieldInvalid('password')">
                Password must be at least 6 characters
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="registerForm.invalid || isLoading">
              <span *ngIf="!isLoading">Create Account & Start Onboarding</span>
              <span *ngIf="isLoading" class="spinner-text">Creating account...</span>
            </button>
          </form>
        </div>

        <div class="auth-footer">
          Already have an account?
          <a routerLink="/auth/login" class="login-link">Sign in here</a>
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
      padding: 2.5rem 1rem;
    }

    .auth-container {
      width: 100%;
      max-width: 520px;
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
      padding: 2.25rem;
      background: #ffffff;
      border: 1px solid var(--slate-200);
      box-shadow: var(--shadow-lg);
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .flex-1 {
      flex: 1;
    }

    .btn-block {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.9375rem;
      margin-top: 0.75rem;
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--slate-600);
    }

    .login-link {
      color: var(--primary-600);
      font-weight: 700;
      text-decoration: none;
      margin-left: 0.375rem;
    }

    .login-link:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required]],
    phone: [''],
    businessName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage = '';

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/onboarding']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please check your information.';
      }
    });
  }
}
