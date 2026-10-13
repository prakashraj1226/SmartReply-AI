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
      <!-- Animated Background Backdrop -->
      <div class="bg-backdrop"></div>

      <!-- Floating Top-Left Brand Logo Badge -->
      <header class="auth-top-header">
        <a routerLink="/" class="brand-badge-wrap">
          <div class="brand-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M8 10h.01"></path>
              <path d="M12 10h.01"></path>
              <path d="M16 10h.01"></path>
            </svg>
          </div>
          <div class="brand-text-logo">
            <span class="brand-name-part">SmartReply</span>
            <span class="brand-tag-ai">AI</span>
          </div>
        </a>
      </header>

      <div class="auth-wrapper">
        <!-- Brand Header & Headline -->
        <div class="auth-headline-wrap">
          <h1 class="auth-headline">Create your business account</h1>
          <p class="auth-subtitle">Automate WhatsApp enquiries & appointments with SmartReply AI</p>
        </div>

        <!-- Error Message -->
        <div class="alert alert-danger" *ngIf="errorMessage">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Register Card -->
        <div class="auth-card">
          <!-- Subtle Top Shimmer Line -->
          <div class="card-shimmer"></div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label" for="fullName">Your Full Name <span class="required">*</span></label>
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
              <label class="form-label" for="businessName">Business Name <span class="required">*</span></label>
              <input
                id="businessName"
                type="text"
                class="form-input"
                [class.error]="isFieldInvalid('businessName')"
                formControlName="businessName"
                placeholder="e.g. Apex Enterprises"
              />
              <div class="field-error" *ngIf="isFieldInvalid('businessName')">Business name is required</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="email">Work Email <span class="required">*</span></label>
              <input
                id="email"
                type="email"
                class="form-input"
                [class.error]="isFieldInvalid('email')"
                formControlName="email"
                placeholder="owner@company.com"
                autocomplete="email"
              />
              <div class="field-error" *ngIf="isFieldInvalid('email')">Valid email is required</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Password (min 6 characters) <span class="required">*</span></label>
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

            <button type="submit" class="btn-submit" [disabled]="registerForm.invalid || isLoading">
              <span *ngIf="!isLoading">Create Account & Start Onboarding &rarr;</span>
              <span *ngIf="isLoading" class="spinner-text">
                <svg class="spinner" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            </button>
          </form>
        </div>

        <div class="auth-footer-note">
          Already have an account?
          <a routerLink="/auth/login" class="register-link">Sign in here</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem 1.25rem;
      position: relative;
      box-sizing: border-box;
      overflow-y: auto;
      overflow-x: hidden;
      font-family: inherit;
    }

    /* Fixed/Floating Top Header Brand Badge on Top-Left */
    .auth-top-header {
      position: absolute;
      top: 1.5rem;
      left: 2rem;
      z-index: 10;
      animation: slideDownFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* Ambient Background Zoom Entrance */
    .bg-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:
        linear-gradient(180deg, rgba(10, 20, 48, 0.72) 0%, rgba(6, 12, 30, 0.88) 100%),
        url('/login-bg.jpg') center center / cover no-repeat;
      animation: bgHeroZoom 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      z-index: 1;
      will-change: transform, filter;
    }

    @keyframes bgHeroZoom {
      0% {
        transform: scale(1.08);
        filter: brightness(0.85);
      }
      100% {
        transform: scale(1);
        filter: brightness(1);
      }
    }

    .auth-wrapper {
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 2;
    }

    /* Brand Header & Headline */
    .auth-headline-wrap {
      margin-bottom: 1.15rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: slideDownFade 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
    }

    .brand-badge-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.4rem 1.05rem 0.4rem 0.55rem;
      border-radius: 9999px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .brand-badge-wrap:hover {
      transform: translateY(-1px) scale(1.02);
      background: rgba(15, 23, 42, 0.85);
      border-color: rgba(255, 255, 255, 0.35);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
    }

    .brand-icon-box {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.45);
    }

    .brand-icon-box svg {
      width: 17px;
      height: 17px;
    }

    .brand-text-logo {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .brand-name-part {
      font-size: 1.05rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .brand-tag-ai {
      font-size: 0.65rem;
      font-weight: 800;
      color: #ffffff;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      letter-spacing: 0.04em;
    }

    .auth-headline {
      color: #ffffff;
      font-size: 1.55rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 0.25rem;
      text-shadow: 0 2px 14px rgba(0, 0, 0, 0.65);
    }

    .auth-subtitle {
      font-size: 0.825rem;
      color: #cbd5e1;
      margin: 0;
      text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
    }

    @keyframes slideDownFade {
      0% {
        opacity: 0;
        transform: translateY(-20px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Register Card */
    .auth-card {
      width: 100%;
      background: #eef2f6;
      border-radius: 18px;
      padding: 1.6rem 1.85rem 1.4rem;
      box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.2);
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      animation: cardEntrance 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .auth-card:hover {
      box-shadow: 0 28px 56px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.3);
    }

    @keyframes cardEntrance {
      0% {
        opacity: 0;
        transform: translateY(24px) scale(0.97);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .card-shimmer {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, transparent, #3b82f6, #93c5fd, transparent);
      animation: shimmerSlide 2.5s ease-in-out 0.8s infinite;
    }

    @keyframes shimmerSlide {
      0% { left: -100%; }
      50%, 100% { left: 100%; }
    }

    .alert-danger {
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.5rem 0.75rem;
      border-radius: 9px;
      font-size: 0.785rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.85rem;
      width: 100%;
      box-sizing: border-box;
      animation: alertPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes alertPop {
      0% { opacity: 0; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }

    .form-row {
      display: flex;
      gap: 0.75rem;
    }

    .flex-1 {
      flex: 1;
    }

    .form-group {
      margin-bottom: 0.8rem;
    }

    .form-label {
      display: block;
      font-size: 0.785rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.28rem;
    }

    .required {
      color: #ef4444;
      font-weight: 700;
    }

    .form-input {
      width: 100%;
      height: 38px;
      padding: 0 0.8rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      font-size: 0.85rem;
      color: #0f172a;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
      outline: none;
    }

    .form-input::placeholder {
      color: #94a3b8;
    }

    .form-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
    }

    .form-input.error {
      border-color: #ef4444;
    }

    .field-error {
      font-size: 0.7rem;
      color: #ef4444;
      margin-top: 0.2rem;
    }

    /* Submit Button */
    .btn-submit {
      width: 100%;
      height: 42px;
      background: #739dfb;
      border: none;
      border-radius: 10px;
      color: #ffffff;
      font-size: 0.925rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1rem;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 14px rgba(115, 157, 251, 0.4);
    }

    .btn-submit:hover:not(:disabled) {
      background: #5b89fa;
      transform: translateY(-2px);
      box-shadow: 0 8px 22px rgba(115, 157, 251, 0.55);
    }

    .btn-submit:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(115, 157, 251, 0.4);
    }

    .btn-submit:disabled {
      opacity: 0.65;
      cursor: not-allowed;
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

    /* Footer Note */
    .auth-footer-note {
      text-align: center;
      margin-top: 0.95rem;
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.8);
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
      animation: fadeIn 0.8s ease 0.6s both;
    }

    @keyframes fadeIn {
      0% {
        opacity: 0;
        transform: translateY(8px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .register-link {
      color: #93c5fd;
      font-weight: 600;
      text-decoration: underline;
      margin-left: 0.35rem;
    }

    .register-link:hover {
      color: #bfdbfe;
    }

    @media (max-width: 640px) {
      .auth-page {
        height: auto;
        min-height: 100vh;
        padding: 4.5rem 1rem 1.5rem;
      }
      .auth-top-header {
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
      }
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      .auth-headline {
        font-size: 1.35rem;
      }
      .auth-card {
        padding: 1.35rem 1.25rem;
      }
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
