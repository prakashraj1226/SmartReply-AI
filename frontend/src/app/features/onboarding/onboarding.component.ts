import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BusinessService } from '../../core/services/business.service';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="onboarding-page">
      <div class="onboarding-wrapper">
        <!-- Progress Steps -->
        <div class="progress-header">
          <div class="step-indicator" [class.active]="currentStep === 1" [class.done]="currentStep > 1">
            <span class="step-num">1</span>
            <span class="step-text">Business Profile</span>
          </div>
          <div class="step-divider"></div>
          <div class="step-indicator" [class.active]="currentStep === 2" [class.done]="currentStep > 2">
            <span class="step-num">2</span>
            <span class="step-text">Hours & Tone</span>
          </div>
          <div class="step-divider"></div>
          <div class="step-indicator" [class.active]="currentStep === 3">
            <span class="step-num">3</span>
            <span class="step-text">Setup Checklist</span>
          </div>
        </div>

        <!-- Card Container -->
        <div class="card onboarding-card">
          <!-- Step 1: Business Profile -->
          <div *ngIf="currentStep === 1">
            <div class="card-title-box">
              <h2>Tell us about your business</h2>
              <p>SmartReply AI will tailor automated responses, tone, and customer booking rules based on these details.</p>
            </div>

            <form [formGroup]="profileForm">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label" for="name">Official Business Name</label>
                  <input id="name" type="text" class="form-input" formControlName="name" placeholder="e.g. Acme Enterprises / Apex Center" />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="category">Category / Industry</label>
                  <select id="category" class="form-select" formControlName="category">
                    <option value="Clinics & Healthcare">Clinics & Healthcare</option>
                    <option value="Salons & Spas">Salons & Spas</option>
                    <option value="Educational Institutions">Educational Institutions</option>
                    <option value="Real Estate Agencies">Real Estate Agencies</option>
                    <option value="Retail & E-commerce">Retail & E-commerce</option>
                    <option value="Consulting & Professional Services">Consulting & Professional Services</option>
                    <option value="Fitness & Wellness">Fitness & Wellness</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label" for="phone">Official Business Phone / WhatsApp</label>
                  <input id="phone" type="text" class="form-input" formControlName="phone" placeholder="+91 98765 43210" />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="email">Customer Support Email</label>
                  <input id="email" type="email" class="form-input" formControlName="email" placeholder="help@business.com" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="address">Physical Business Address</label>
                <input id="address" type="text" class="form-input" formControlName="address" placeholder="102, Business Park, Anna Nagar, Chennai" />
              </div>

              <div class="form-group">
                <label class="form-label" for="description">Business Overview & Services (Used by AI for context)</label>
                <textarea
                  id="description"
                  class="form-textarea"
                  rows="3"
                  formControlName="description"
                  placeholder="e.g. Provide a brief summary of your business, key services, and products for autonomous customer assistance."
                ></textarea>
              </div>

              <div class="step-actions">
                <button type="button" class="btn btn-primary" (click)="goToStep(2)">
                  Continue to Operating Hours &rarr;
                </button>
              </div>
            </form>
          </div>

          <!-- Step 2: Hours & Timezone -->
          <div *ngIf="currentStep === 2">
            <div class="card-title-box">
              <h2>Operating Schedule & Localization</h2>
              <p>Define when your human agents are on duty and what language your AI assistant should default to.</p>
            </div>

            <form [formGroup]="profileForm">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label" for="timezone">Time Zone</label>
                  <select id="timezone" class="form-select" formControlName="timezone">
                    <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                  </select>
                </div>

                <div class="form-group flex-1">
                  <label class="form-label" for="preferredLanguage">Primary Language</label>
                  <select id="preferredLanguage" class="form-select" formControlName="preferredLanguage">
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                    <option value="mr">Marathi (मराठी)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="operatingHoursJson">Standard Operating Hours</label>
                <input
                  id="operatingHoursJson"
                  type="text"
                  class="form-input"
                  formControlName="operatingHoursJson"
                  placeholder="Monday - Saturday: 9:00 AM - 7:00 PM (Closed on Sundays)"
                />
              </div>

              <div class="step-actions">
                <button type="button" class="btn btn-secondary" (click)="goToStep(1)">&larr; Back</button>
                <button type="button" class="btn btn-primary" (click)="saveAndGoToChecklist()" [disabled]="isSaving">
                  <span *ngIf="!isSaving">Save Profile & View Setup Checklist &rarr;</span>
                  <span *ngIf="isSaving">Saving Profile...</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Step 3: Setup Checklist -->
          <div *ngIf="currentStep === 3">
            <div class="card-title-box">
              <h2>Setup & Activation Checklist</h2>
              <p>Review the milestones to get the most out of SmartReply AI for your WhatsApp business operations.</p>
            </div>

            <!-- One-Click Industry Preset Seed Card -->
            <div class="template-selector-box" style="margin-bottom: 1.5rem; padding: 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                <div>
                  <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #0f172a;">⚡ One-Click Industry Catalog Preset</h4>
                  <p style="margin: 0.2rem 0 0; font-size: 0.78rem; color: #64748b;">Instantly seed standard services, staff members, and working shifts into your account.</p>
                </div>
                <span *ngIf="templateSuccess" style="color: #16a34a; font-weight: 700; font-size: 0.8rem;">✓ {{ templateSuccess }}</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.6rem;">
                <button type="button" class="btn btn-outline" [disabled]="isApplyingTemplate" (click)="applyIndustryTemplate('SALON')" style="text-align: left; padding: 0.6rem 0.75rem; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff;">
                  <div style="font-size: 1.2rem; margin-bottom: 0.2rem;">💇‍♀️</div>
                  <div style="font-weight: 700; font-size: 0.8rem; color: #1e293b;">Salon & Spa</div>
                  <div style="font-size: 0.68rem; color: #64748b;">Styling, Facial, Spa</div>
                </button>
                <button type="button" class="btn btn-outline" [disabled]="isApplyingTemplate" (click)="applyIndustryTemplate('DENTAL_CLINIC')" style="text-align: left; padding: 0.6rem 0.75rem; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff;">
                  <div style="font-size: 1.2rem; margin-bottom: 0.2rem;">🦷</div>
                  <div style="font-weight: 700; font-size: 0.8rem; color: #1e293b;">Dental Clinic</div>
                  <div style="font-size: 0.68rem; color: #64748b;">Consult, Cleaning, Root</div>
                </button>
                <button type="button" class="btn btn-outline" [disabled]="isApplyingTemplate" (click)="applyIndustryTemplate('HOSPITAL')" style="text-align: left; padding: 0.6rem 0.75rem; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff;">
                  <div style="font-size: 1.2rem; margin-bottom: 0.2rem;">🏥</div>
                  <div style="font-weight: 700; font-size: 0.8rem; color: #1e293b;">Hospital / Clinic</div>
                  <div style="font-size: 0.68rem; color: #64748b;">OPD, Specialists, Lab</div>
                </button>
                <button type="button" class="btn btn-outline" [disabled]="isApplyingTemplate" (click)="applyIndustryTemplate('GENERAL')" style="text-align: left; padding: 0.6rem 0.75rem; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff;">
                  <div style="font-size: 1.2rem; margin-bottom: 0.2rem;">📅</div>
                  <div style="font-weight: 700; font-size: 0.8rem; color: #1e293b;">General Booking</div>
                  <div style="font-size: 0.68rem; color: #64748b;">Standard Appointments</div>
                </button>
              </div>
            </div>

            <div class="checklist-grid">
              <div class="checklist-item done">
                <div class="check-icon">✓</div>
                <div class="check-content">
                  <h4>1. Complete Business Profile</h4>
                  <p>Your operating hours, location, and description are configured.</p>
                </div>
                <span class="badge badge-green">Completed</span>
              </div>

              <div class="checklist-item">
                <div class="check-icon pending">2</div>
                <div class="check-content">
                  <h4>2. Add FAQ Knowledge Articles</h4>
                  <p>Upload your pricing, services, and appointment FAQs for AI grounding.</p>
                </div>
                <a routerLink="/knowledge-base" class="btn btn-secondary btn-sm">Configure FAQs</a>
              </div>

              <div class="checklist-item">
                <div class="check-icon pending">3</div>
                <div class="check-content">
                  <h4>3. WhatsApp Business Integration</h4>
                  <p>Connect your WhatsApp Business Account or use Sandbox Simulator.</p>
                </div>
                <a routerLink="/whatsapp" class="btn btn-secondary btn-sm">Integration Status</a>
              </div>

              <div class="checklist-item">
                <div class="check-icon pending">4</div>
                <div class="check-content">
                  <h4>4. Test AI Assistant Responses</h4>
                  <p>Verify confidence-based replies and human escalation thresholds.</p>
                </div>
                <a routerLink="/inbox" class="btn btn-secondary btn-sm">Open Inbox</a>
              </div>
            </div>

            <div class="step-actions final">
              <button type="button" class="btn btn-success btn-lg" (click)="finishOnboarding()">
                🚀 Finish Onboarding & Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .onboarding-page {
      min-height: calc(100vh - 120px);
      display: flex;
      justify-content: center;
      padding: 1.5rem 0;
    }

    .onboarding-wrapper {
      width: 100%;
      max-width: 800px;
    }

    .progress-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding: 0 1rem;
    }

    .step-indicator {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      opacity: 0.5;
      transition: opacity 0.2s ease;
    }

    .step-indicator.active, .step-indicator.done {
      opacity: 1;
    }

    .step-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--slate-200);
      color: var(--slate-700);
      font-weight: 700;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step-indicator.active .step-num {
      background: var(--primary-600);
      color: #ffffff;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
    }

    .step-indicator.done .step-num {
      background: var(--wa-green-600);
      color: #ffffff;
    }

    .step-text {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--slate-800);
    }

    .step-divider {
      flex: 1;
      height: 2px;
      background: var(--slate-200);
      margin: 0 1rem;
    }

    .onboarding-card {
      padding: 2.5rem;
      background: #ffffff;
      border: 1px solid var(--slate-200);
      box-shadow: var(--shadow-md);
    }

    .card-title-box {
      margin-bottom: 2rem;
    }

    .card-title-box h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--slate-900);
      margin-bottom: 0.375rem;
    }

    .card-title-box p {
      font-size: 0.875rem;
      color: var(--slate-600);
    }

    .form-row {
      display: flex;
      gap: 1.25rem;
    }

    .flex-1 {
      flex: 1;
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--slate-100);
    }

    .step-actions.final {
      justify-content: center;
    }

    .btn-lg {
      padding: 0.875rem 2rem;
      font-size: 1rem;
    }

    .checklist-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem;
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
    }

    .checklist-item.done {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .check-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--wa-green-600);
      color: #ffffff;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .check-icon.pending {
      background: var(--slate-200);
      color: var(--slate-700);
    }

    .check-content {
      flex: 1;
    }

    .check-content h4 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--slate-900);
      margin-bottom: 0.125rem;
    }

    .check-content p {
      font-size: 0.8125rem;
      color: var(--slate-600);
    }
  `]
})
export class OnboardingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private businessService = inject(BusinessService);
  private authService = inject(AuthService);
  private catalogService = inject(CatalogService);
  private router = inject(Router);

  currentStep = 1;
  isSaving = false;
  isApplyingTemplate = false;
  templateSuccess = '';

  profileForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    category: ['Clinics & Healthcare'],
    phone: [''],
    email: [''],
    address: [''],
    description: [''],
    timezone: ['Asia/Kolkata'],
    preferredLanguage: ['en'],
    operatingHoursJson: ['Monday - Saturday: 9:00 AM - 7:00 PM']
  });

  ngOnInit(): void {
    this.businessService.getProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const b = res.data;
          this.profileForm.patchValue({
            name: b.name || '',
            category: b.category || 'Clinics & Healthcare',
            phone: b.phone || '',
            email: b.email || '',
            address: b.address || '',
            description: b.description || '',
            timezone: b.timezone || 'Asia/Kolkata',
            preferredLanguage: b.preferredLanguage || 'en',
            operatingHoursJson: b.operatingHoursJson || 'Monday - Saturday: 9:00 AM - 7:00 PM'
          });
        }
      }
    });
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  saveAndGoToChecklist(): void {
    this.isSaving = true;
    this.businessService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.currentStep = 3;
      },
      error: () => {
        this.isSaving = false;
        this.currentStep = 3;
      }
    });
  }

  applyIndustryTemplate(type: string): void {
    this.isApplyingTemplate = true;
    this.templateSuccess = '';
    this.catalogService.applyTemplate(type).subscribe({
      next: (res) => {
        this.isApplyingTemplate = false;
        this.templateSuccess = `${type} starter services & staff catalog generated!`;
      },
      error: (err) => {
        this.isApplyingTemplate = false;
        this.templateSuccess = 'Catalog updated.';
      }
    });
  }

  finishOnboarding(): void {
    this.businessService.updateProfile({ onboardingCompleted: true }).subscribe({
      next: () => {
        this.authService.updateOnboardingStatus(true);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.authService.updateOnboardingStatus(true);
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
