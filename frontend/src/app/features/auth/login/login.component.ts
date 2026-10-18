import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
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
        <!-- Top Headline -->
        <div class="auth-headline-wrap">
          <h1 class="auth-headline">Your AI assistant, one tap away.</h1>
        </div>

        <!-- Centered Card -->
        <div class="auth-card">
          <!-- Subtle Top Shimmer Line -->
          <div class="card-shimmer"></div>

          <div class="card-header">
            <h2 class="card-title">Sign in</h2>
            <p class="card-subtitle">Use your staff account to continue</p>
          </div>

          <!-- Alert Error Message -->
          <div class="alert alert-danger" *ngIf="errorMessage">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <!-- Username / Email / Mobile Field -->
            <div class="form-group">
              <label class="form-label" for="email">Email or Mobile Number <span class="required">*</span></label>
              <div class="input-wrap">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  id="email"
                  type="text"
                  class="form-input"
                  [class.error]="isFieldInvalid('email')"
                  formControlName="email"
                  placeholder="Enter email or mobile number"
                  autocomplete="username"
                />
              </div>
              <div class="field-error" *ngIf="isFieldInvalid('email')">
                Please enter your email or mobile number
              </div>
            </div>

            <!-- Password Field -->
            <div class="form-group">
              <label class="form-label" for="password">Password <span class="required">*</span></label>
              <div class="input-wrap">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  class="form-input"
                  [class.error]="isFieldInvalid('password')"
                  formControlName="password"
                  placeholder="Enter password"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="toggle-password-btn"
                  (click)="showPassword = !showPassword"
                  [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                >
                  <svg *ngIf="!showPassword" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg *ngIf="showPassword" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </button>
              </div>
              <div class="field-error" *ngIf="isFieldInvalid('password')">
                Password is required
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn-submit" [disabled]="loginForm.invalid || isLoading">
              <span *ngIf="!isLoading">Sign in &rarr;</span>
              <span *ngIf="isLoading" class="spinner-text">
                <svg class="spinner" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            </button>

            <!-- Forgot Password Link -->
            <div class="forgot-wrap">
              <a href="javascript:void(0)" class="forgot-link" (click)="openForgotModal()">
                Forgot Super Admin password?
              </a>
            </div>
          </form>

        </div>

        <!-- Auth Footer (Registration link) -->
        <div class="auth-footer-note">
          Don't have an account?
          <a routerLink="/auth/register" class="register-link">Start 14-day free trial</a>
        </div>
      </div>

      <!-- Super Admin Forgot Password Modal Overlay -->
      <div class="modal-backdrop" *ngIf="showForgotModal" (click)="closeForgotModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">

          <!-- Step 1: Request Reset Link -->
          <div *ngIf="forgotStep === 'REQUEST'">
            <h3 class="modal-title">Super Admin Forgot Password</h3>
            <p class="modal-desc">
              Enter your Super Admin username or registered email address. Password reset instructions will be sent to the email address registered for Super Admin.
            </p>

            <div class="alert alert-danger" *ngIf="forgotError">
              <span>{{ forgotError }}</span>
            </div>

            <div class="modal-form-group">
              <label class="modal-label">Username or Email <span class="required">*</span></label>
              <input
                type="text"
                class="modal-input"
                [(ngModel)]="forgotEmail"
                [ngModelOptions]="{standalone: true}"
                placeholder="Enter username or email"
                (keyup.enter)="sendResetLink()"
                autofocus
              />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-modal-cancel" (click)="closeForgotModal()">Cancel</button>
              <button
                type="button"
                class="btn-modal-primary"
                [disabled]="!forgotEmail.trim() || forgotLoading"
                (click)="sendResetLink()"
              >
                <span *ngIf="!forgotLoading">Send Reset Link</span>
                <span *ngIf="forgotLoading">Sending...</span>
              </button>
            </div>
          </div>

          <!-- Step 2: Update Password Form -->
          <div *ngIf="forgotStep === 'RESET'">
            <h3 class="modal-title">Update Password</h3>
            <p class="modal-desc">
              Reset instructions dispatched to <strong>{{ forgotEmail }}</strong>! Enter your new password below to update your account.
            </p>

            <div class="alert alert-danger" *ngIf="forgotError">
              <span>{{ forgotError }}</span>
            </div>

            <div class="modal-form-group">
              <label class="modal-label">New Password <span class="required">*</span></label>
              <input
                type="password"
                class="modal-input"
                [(ngModel)]="newPassword"
                [ngModelOptions]="{standalone: true}"
                placeholder="Enter at least 6 characters"
              />
            </div>

            <div class="modal-form-group">
              <label class="modal-label">Confirm New Password <span class="required">*</span></label>
              <input
                type="password"
                class="modal-input"
                [(ngModel)]="confirmPassword"
                [ngModelOptions]="{standalone: true}"
                placeholder="Re-enter new password"
                (keyup.enter)="updatePassword()"
              />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-modal-cancel" (click)="closeForgotModal()">Cancel</button>
              <button
                type="button"
                class="btn-modal-primary"
                [disabled]="!newPassword || newPassword.length < 6 || newPassword !== confirmPassword || forgotLoading"
                (click)="updatePassword()"
              >
                <span *ngIf="!forgotLoading">Update Password &rarr;</span>
                <span *ngIf="forgotLoading">Updating...</span>
              </button>
            </div>
          </div>

          <!-- Step 3: Success State -->
          <div *ngIf="forgotStep === 'SUCCESS'" class="modal-success-wrap">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 class="modal-title">Password Updated Successfully!</h3>
            <p class="modal-desc">{{ forgotSuccessMessage }}</p>
            <button type="button" class="btn-modal-primary btn-full" (click)="closeForgotModal()">
              Sign In with New Password
            </button>
          </div>

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
      max-width: 440px;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 2;
    }

    /* Top Brand Badge & Headline */
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
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0;
      text-shadow: 0 2px 14px rgba(0, 0, 0, 0.65);
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

    /* Centered Login Card - Smooth Float Up Entrance */
    .auth-card {
      width: 100%;
      background: #eef2f6;
      border-radius: 18px;
      padding: 1.6rem 1.85rem 1.35rem;
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

    /* Subtle Animated Top Shimmer Accent */
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

    .card-header {
      text-align: center;
      margin-bottom: 1.15rem;
    }

    .card-title {
      font-size: 1.45rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.25rem;
      letter-spacing: -0.01em;
    }

    .card-subtitle {
      font-size: 0.825rem;
      color: #64748b;
      margin: 0;
    }

    /* Alert Message */
    .alert-danger {
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.625rem 0.875rem;
      border-radius: 10px;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      animation: alertPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes alertPop {
      0% { opacity: 0; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }

    /* Form Groups - Staggered Soft Entrance */
    .form-group {
      margin-bottom: 0.85rem;
    }

    .form-group:nth-child(1) {
      animation: fieldEntrance 0.6s ease 0.35s both;
    }

    .form-group:nth-child(2) {
      animation: fieldEntrance 0.6s ease 0.45s both;
    }

    @keyframes fieldEntrance {
      0% {
        opacity: 0;
        transform: translateY(10px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .form-label {
      display: block;
      font-size: 0.785rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.3rem;
    }

    .required {
      color: #ef4444;
      font-weight: 700;
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      pointer-events: none;
      transition: color 0.2s ease;
    }

    .form-input {
      width: 100%;
      height: 40px;
      padding: 0 2.5rem 0 2.5rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      font-size: 0.875rem;
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

    .input-wrap:focus-within .input-icon {
      color: #3b82f6;
    }

    .form-input.error {
      border-color: #ef4444;
    }

    .field-error {
      font-size: 0.725rem;
      color: #ef4444;
      margin-top: 0.25rem;
    }

    .toggle-password-btn {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease, transform 0.15s ease;
    }

    .toggle-password-btn:hover {
      color: #475569;
      transform: scale(1.1);
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
      margin-top: 0.95rem;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 14px rgba(115, 157, 251, 0.4);
      animation: fieldEntrance 0.6s ease 0.55s both;
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

    /* Forgot Password Link */
    .forgot-wrap {
      text-align: center;
      margin-top: 0.75rem;
      animation: fieldEntrance 0.6s ease 0.6s both;
    }

    .forgot-link {
      font-size: 0.785rem;
      color: #2563eb;
      text-decoration: underline;
      font-weight: 500;
      transition: color 0.15s ease;
    }

    .forgot-link:hover {
      color: #1d4ed8;
    }

    /* Quick Test Demo Pre-fill */
    .demo-box {
      margin-top: 0.85rem;
      padding-top: 0.75rem;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      animation: fieldEntrance 0.6s ease 0.65s both;
    }

    .demo-title {
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
    }

    .btn-demo {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
      padding: 0.35rem 0.65rem;
      border-radius: 7px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
    }

    .btn-demo:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      transform: translateX(2px);
    }

    /* Footer Note */
    .auth-footer-note {
      text-align: center;
      margin-top: 0.95rem;
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.8);
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
      animation: fadeIn 0.8s ease 0.75s both;
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
      .auth-headline {
        font-size: 1.35rem;
      }
      .auth-card {
        padding: 1.35rem 1.25rem;
      }
    }

    /* Forgot Password Modal Dialog (Matching Reference Screenshot) */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(8, 14, 32, 0.72);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeInModal 0.25s ease both;
    }

    @keyframes fadeInModal {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }

    .modal-card {
      background: #f8fafc;
      border-radius: 18px;
      padding: 2.25rem 2rem;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3);
      box-sizing: border-box;
      animation: popUpModal 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      position: relative;
    }

    @keyframes popUpModal {
      0% {
        opacity: 0;
        transform: scale(0.94) translateY(12px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      text-align: center;
      margin: 0 0 0.65rem;
      letter-spacing: -0.01em;
    }

    .modal-desc {
      font-size: 0.84rem;
      color: #475569;
      text-align: center;
      line-height: 1.5;
      margin: 0 0 1.5rem;
    }

    .modal-form-group {
      margin-bottom: 1.15rem;
    }

    .modal-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.4rem;
    }

    .modal-input {
      width: 100%;
      height: 44px;
      padding: 0 1rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.9rem;
      color: #0f172a;
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    .modal-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
    }

    .modal-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.75rem;
    }

    .btn-modal-cancel {
      padding: 0.65rem 1.35rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      color: #334155;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-modal-cancel:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }

    .btn-modal-primary {
      padding: 0.65rem 1.35rem;
      background: #2563eb;
      border: none;
      border-radius: 8px;
      color: #ffffff;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 3px 10px rgba(37, 99, 235, 0.35);
    }

    .btn-modal-primary:hover:not(:disabled) {
      background: #1d4ed8;
      box-shadow: 0 5px 14px rgba(37, 99, 235, 0.45);
    }

    .btn-modal-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-full {
      width: 100%;
      height: 44px;
      margin-top: 1rem;
    }

    /* Modal Success View */
    .modal-success-wrap {
      text-align: center;
      padding: 1rem 0 0.5rem;
    }

    .success-icon {
      width: 52px;
      height: 52px;
      background: #dcfce7;
      color: #16a34a;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
    }
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  isLoading = false;
  showPassword = false;
  errorMessage = '';

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('reason') === 'suspended') {
      this.errorMessage = 'This business account has been suspended. Please contact support.';
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }



  showForgotNotice() {
    this.openForgotModal();
  }

  // Forgot Password Modal State & Methods
  showForgotModal = false;
  forgotStep: 'REQUEST' | 'RESET' | 'SUCCESS' = 'REQUEST';
  forgotEmail = '';
  resetToken = '';
  newPassword = '';
  confirmPassword = '';
  forgotLoading = false;
  forgotError = '';
  forgotSuccessMessage = '';

  openForgotModal() {
    this.showForgotModal = true;
    this.forgotStep = 'REQUEST';
    this.forgotEmail = this.loginForm.get('email')?.value || '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.forgotError = '';
    this.forgotSuccessMessage = '';
  }

  closeForgotModal() {
    this.showForgotModal = false;
    this.forgotStep = 'REQUEST';
    this.forgotLoading = false;
    this.forgotError = '';
  }

  sendResetLink() {
    if (!this.forgotEmail || !this.forgotEmail.trim()) {
      this.forgotError = 'Please enter your username or registered email.';
      return;
    }

    this.forgotLoading = true;
    this.forgotError = '';

    this.authService.forgotPassword(this.forgotEmail.trim()).subscribe({
      next: (res) => {
        this.forgotLoading = false;
        this.resetToken = res.data?.resetToken || '';
        // Transition to Password Update step
        this.forgotStep = 'RESET';
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotError = err.error?.message || 'Failed to dispatch reset link. Please check your email and try again.';
      }
    });
  }

  updatePassword() {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.forgotError = 'Password must be at least 6 characters.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.forgotError = 'Passwords do not match.';
      return;
    }

    this.forgotLoading = true;
    this.forgotError = '';

    this.authService.resetPassword({
      email: this.forgotEmail.trim(),
      token: this.resetToken,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.forgotLoading = false;
        this.forgotSuccessMessage = res.data?.message || 'Password updated successfully! You can now sign in.';
        this.forgotStep = 'SUCCESS';
        // Auto-fill login form
        this.loginForm.patchValue({
          email: this.forgotEmail.trim(),
          password: this.newPassword
        });
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotError = err.error?.message || 'Failed to update password. Please try again.';
      }
    });
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
        const tenantRole = (res.data?.tenantRole || res.data?.role || '').toUpperCase();
        if (tenantRole === 'SUPER_ADMIN') {
          this.router.navigate(['/admin']);
        } else if (!res.data?.onboardingCompleted && (tenantRole === 'OWNER' || tenantRole === 'BUSINESS_OWNER')) {
          this.router.navigate(['/onboarding']);
        } else if (tenantRole === 'RECEPTIONIST' || tenantRole === 'SALON_STAFF' || tenantRole === 'DOCTOR' || tenantRole === 'DENTIST') {
          this.router.navigate(['/appointments']);
        } else if (tenantRole === 'AGENT') {
          this.router.navigate(['/inbox']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid email/phone or password. Please try again.';
      }
    });
  }
}
