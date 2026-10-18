import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SettingsService, BusinessProfile, AiConfig, TeamMember, InviteMemberRequest, UpdateTeamMemberRequest } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { SubscriptionService } from '../../core/services/subscription.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">

      <!-- 1. Glowing Hero Gradient Card (Reference 4 & 5 Style) -->
      <div class="hero-banner-card">
        <div class="hero-banner-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>ENTERPRISE WORKSPACE CONFIGURATION</span>
          </div>
          <h1 class="hero-title">Settings & AI Assistant Persona</h1>
          <p class="hero-subtitle">
            Configure your clinic identity, fine-tune the AI auto-reply persona, manage authorized staff agents, and verify security protocols.
          </p>
        </div>
        <div class="hero-actions">
          <button type="button" class="btn-hero-primary" (click)="saveCurrentTab()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      <!-- 2. Integrated 4-Column Stat Cards Row (Reference 4 Style) -->
      <div class="kpi-grid">
        <div class="kpi-card active-accent">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator blue"></span>
              <span class="kpi-label">ORGANIZATION</span>
            </div>
            <div class="kpi-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
                <line x1="9" x2="9" y1="6" y2="6"></line>
                <line x1="15" x2="15" y1="6" y2="6"></line>
              </svg>
            </div>
          </div>
          <div class="kpi-number clinic-title">{{ profile.name || authService.currentUser()?.businessName || 'Workspace' }}</div>
          <div class="kpi-subtext">{{ profile.category || 'Business Profile' }}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator green"></span>
              <span class="kpi-label">AI GROUNDING THRESHOLD</span>
            </div>
            <div class="kpi-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ (aiConfig.confidenceThreshold * 100).toFixed(0) }}%</div>
          <div class="kpi-subtext">High precision FAQ match required</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator amber"></span>
              <span class="kpi-label">STAFF SEATS</span>
            </div>
            <div class="kpi-icon-box amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
          <div class="kpi-number">{{ staffOnlyCount() }}/{{ staffLimit() }} Seats</div>
          <div class="kpi-subtext">{{ teamMembers().length }} total (1 Owner + {{ staffOnlyCount() }} Staff)</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-label-box">
              <span class="status-indicator purple"></span>
              <span class="kpi-label">DATA SECURITY</span>
            </div>
            <div class="kpi-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
          </div>
          <div class="kpi-number sec-badge">HIPAA Compliant</div>
          <div class="kpi-subtext">256-bit encryption in transit & rest</div>
        </div>
      </div>

      <!-- ALERTS -->
      <div *ngIf="alertMessage()" class="alert-banner" [ngClass]="alertType()">
        <div class="alert-content">
          <span class="alert-icon">{{ alertType() === 'success' ? '✓' : '⚠' }}</span>
          <span>{{ alertMessage() }}</span>
        </div>
        <button class="alert-close" (click)="alertMessage.set(null)">✕</button>
      </div>

      <!-- 3. Tab Pills Toolbar -->
      <div class="toolbar-nav">
        <div class="tabs-pills">
          <button class="tab-pill-btn" [class.active]="activeTab() === 'profile'" (click)="setTab('profile')">
            🏢 Business Profile
          </button>
          <button class="tab-pill-btn" [class.active]="activeTab() === 'ai'" (click)="setTab('ai')">
            🤖 AI Persona & Tuning
          </button>
          <button class="tab-pill-btn" [class.active]="activeTab() === 'team'" (click)="setTab('team')">
            👥 Staff & Agents ({{ staffOnlyCount() }}/{{ staffLimit() }})
          </button>
          <button class="tab-pill-btn" [class.active]="activeTab() === 'security'" (click)="setTab('security')">
            🔒 Security & Compliance
          </button>
          <button class="tab-pill-btn" [class.active]="activeTab() === 'app'" (click)="setTab('app')">
            📱 App & Server
          </button>
        </div>
      </div>

      <!-- TAB 1: BUSINESS PROFILE -->
      <div *ngIf="activeTab() === 'profile'" class="content-card">
        <div class="card-header-flex">
          <div class="title-with-badge">
            <div class="icon-badge blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
              </svg>
            </div>
            <div>
              <h3 class="card-main-title">Clinic Identity & Public Profile</h3>
              <p class="card-sub-title">Used on WhatsApp greetings, appointments, and billing statements</p>
            </div>
          </div>
        </div>

        <form (ngSubmit)="saveProfile()" class="card-body-form">
          <div class="form-row-2">
            <div class="form-group">
              <label>Business Name *</label>
              <input type="text" [(ngModel)]="profile.name" name="name" class="form-control" placeholder="e.g. Acme Services / Wellness Center" />
            </div>
            <div class="form-group">
              <label>Industry Category</label>
              <select [(ngModel)]="profile.category" name="category" class="form-control">
                <option value="Healthcare & Dental">Healthcare & Dental</option>
                <option value="Salon & Wellness">Salon & Wellness</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Educational Institution">Educational Institution</option>
                <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                <option value="Professional Services">Professional Services</option>
              </select>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label>Official Business Email</label>
              <input type="email" [(ngModel)]="profile.email" name="email" class="form-control" placeholder="contact@example.com" />
            </div>
            <div class="form-group">
              <label>Official Contact Phone</label>
              <input type="text" [(ngModel)]="profile.phone" name="phone" class="form-control" placeholder="+91 98401 23456" />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label>Clinic Address</label>
              <input type="text" [(ngModel)]="profile.address" name="address" class="form-control" placeholder="No. 42, 2nd Avenue, Anna Nagar, Chennai - 600040" />
            </div>
            <div class="form-group">
              <label>Timezone</label>
              <select [(ngModel)]="profile.timezone" name="timezone" class="form-control">
                <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Business Description & Services</label>
            <textarea [(ngModel)]="profile.description" name="description" rows="3" class="form-control" placeholder="Describe your business services, opening hours, and products offered."></textarea>
          </div>

          <div class="form-actions-bar">
            <button type="submit" class="btn-save-primary" [disabled]="isSaving()">
              <span *ngIf="!isSaving()">Save Profile Changes</span>
              <span *ngIf="isSaving()" class="spinner-sm"></span>
            </button>
          </div>
        </form>
      </div>

      <!-- TAB 2: AI PERSONA & TUNING -->
      <div *ngIf="activeTab() === 'ai'" class="content-card">
        <div class="card-header-flex">
          <div class="title-with-badge">
            <div class="icon-badge green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div>
              <h3 class="card-main-title">AI Assistant Persona & Grounding Policy</h3>
              <p class="card-sub-title">Fine-tune the autonomous tone, greeting message, and confidence threshold</p>
            </div>
          </div>
        </div>

        <form (ngSubmit)="saveAiConfig()" class="card-body-form">
          <div class="form-row-2">
            <div class="form-group">
              <label>AI Assistant Name</label>
              <input type="text" [(ngModel)]="aiConfig.assistantName" name="assistantName" class="form-control" placeholder="AI Customer Concierge" />
            </div>
            <div class="form-group">
              <label>Conversation Tone</label>
              <select [(ngModel)]="aiConfig.tone" name="tone" class="form-control">
                <option value="PROFESSIONAL">Professional & Courteous</option>
                <option value="WARM_EMPATHETIC">Warm & Empathetic</option>
                <option value="CASUAL_FRIENDLY">Casual & Friendly</option>
                <option value="FORMAL">Strict & Formal</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Welcome Greeting Message</label>
            <textarea [(ngModel)]="aiConfig.greetingMessage" name="greetingMessage" rows="2" class="form-control" placeholder="Hello! Welcome to our business. How can we help you today?"></textarea>
          </div>

          <div class="form-group">
            <label>Human Escalation Fallback Message</label>
            <textarea [(ngModel)]="aiConfig.fallbackMessage" name="fallbackMessage" rows="2" class="form-control" placeholder="I will connect you directly with a team member right away."></textarea>
          </div>

          <div class="slider-box">
            <div class="slider-header-row">
              <label class="slider-title">Knowledge Base Match Confidence Threshold</label>
              <span class="slider-val">{{ (aiConfig.confidenceThreshold * 100).toFixed(0) }}%</span>
            </div>
            <input type="range" min="0.5" max="0.95" step="0.01" [(ngModel)]="aiConfig.confidenceThreshold" name="confidenceThreshold" class="range-slider" />
            <p class="slider-desc">Higher confidence (e.g. 75-80%) guarantees AI replies strictly from verified clinic FAQs without hallucinating.</p>
          </div>

          <div class="form-actions-bar">
            <button type="submit" class="btn-save-primary" [disabled]="isSaving()">
              <span *ngIf="!isSaving()">Save AI Persona Settings</span>
              <span *ngIf="isSaving()" class="spinner-sm"></span>
            </button>
          </div>
        </form>
      </div>

      <!-- TAB 3: TEAM & AGENTS -->
      <div *ngIf="activeTab() === 'team'" class="table-card">
        <div class="card-header-flex">
          <div class="table-title-box">
            <div class="table-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h3 class="table-title">Staff Members & Clinical Agents</h3>
              <p class="table-subtitle">Authorize doctors, receptionists, and staff to respond in Live Inbox</p>
            </div>
          </div>
          <button
            type="button"
            class="btn-add-agent"
            [class.btn-limit-reached]="staffOnlyCount() >= staffLimit()"
            (click)="onInviteStaffClick()"
          >
            <span *ngIf="staffOnlyCount() < staffLimit()">+ Invite Staff Member</span>
            <span *ngIf="staffOnlyCount() >= staffLimit()">🔒 Staff Limit ({{ staffOnlyCount() }}/{{ staffLimit() }})</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email Address</th>
                <th>Mobile Number</th>
                <th>Role</th>
                <th>Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of teamMembers()">
                <td>
                  <div class="user-cell">
                    <div class="member-avatar">{{ (m.fullName || 'U').charAt(0).toUpperCase() }}</div>
                    <strong>{{ m.fullName }}</strong>
                  </div>
                </td>
                <td>{{ m.email }}</td>
                <td>{{ m.phone || '—' }}</td>
                <td><span class="role-pill">{{ (m.role || '').replace('_', ' ') }}</span></td>
                <td>
                  <span [class]="m.membershipStatus === 'SUSPENDED' ? 'status-pill-amber' : 'status-pill-green'">
                    ● {{ m.membershipStatus === 'SUSPENDED' ? 'Suspended' : 'Active' }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="action-btn-group">
                    <button class="btn-edit-user" (click)="openEditModal(m)" title="Edit Staff Member">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button *ngIf="!isOwnerRole(m.role)" class="btn-remove-user" (click)="removeMember(m)" title="Remove Staff Member">Remove</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 4: SECURITY & COMPLIANCE -->
      <div *ngIf="activeTab() === 'security'" class="content-card">
        <div class="card-header-flex">
          <div class="title-with-badge">
            <div class="icon-badge purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <h3 class="card-main-title">Data Privacy & Security Protocols</h3>
              <p class="card-sub-title">Enterprise grade multi-tenant isolation and Meta webhook encryption</p>
            </div>
          </div>
        </div>

        <div class="card-body-form">
          <div class="sec-item-row">
            <div class="sec-icon-box">✓</div>
            <div>
              <h4>HMAC-SHA256 Webhook Verification</h4>
              <p>All inbound WhatsApp events from Meta are authenticated using SHA256 secret signing.</p>
            </div>
          </div>

          <div class="sec-item-row">
            <div class="sec-icon-box">✓</div>
            <div>
              <h4>Tenant Row-Level Data Segregation</h4>
              <p>Each clinic's patient roster, conversations, and FAQs are isolated by Tenant ID partitioning.</p>
            </div>
          </div>

          <div class="sec-item-row">
            <div class="sec-icon-box">✓</div>
            <div>
              <h4>Role-Based Access Control (RBAC)</h4>
              <p>Only verified clinic owners and invited agents can inspect patient communication histories.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 5: APP & SERVER -->
      <div *ngIf="activeTab() === 'app'" class="content-card">
        <div class="card-header-flex">
          <div class="title-with-badge">
            <div class="icon-badge blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </div>
            <div>
              <h3 class="card-main-title">Mobile App & Server Connection</h3>
              <p class="card-sub-title">Configure backend API endpoint and manage session</p>
            </div>
          </div>
        </div>

        <div class="card-body-form" style="display: flex; flex-direction: column; gap: 1.25rem; padding: 1.25rem;">
          <div class="form-group">
            <label style="font-weight: 600; font-size: 0.85rem; color: #1e293b; display: block; margin-bottom: 0.35rem;">Backend API URL</label>
            <input type="text" [(ngModel)]="customApiUrl" class="form-control" style="width: 100%; padding: 0.6rem 0.8rem; border-radius: 8px; border: 1px solid #cbd5e1; box-sizing: border-box;" placeholder="https://smartreply-backend-lyda.onrender.com/api" />
            <span style="font-size: 0.75rem; color: #64748b; margin-top: 0.35rem; display: block;">Supports production, emulator (http://10.0.2.2:8081/api), or local LAN (http://&lt;your-ip&gt;:8081/api).</span>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <button type="button" class="btn-cancel" (click)="setPresetApiUrl('https://smartreply-backend-lyda.onrender.com/api')">Production (Render)</button>
            <button type="button" class="btn-cancel" (click)="setPresetApiUrl('http://10.0.2.2:8081/api')">Android Emulator</button>
            <button type="button" class="btn-cancel" (click)="setPresetApiUrl('http://localhost:8081/api')">Localhost (8081)</button>
            <button type="button" class="btn-send-sim" style="background: #2563eb; color: #ffffff; border: none; padding: 0.55rem 1.25rem; border-radius: 8px; font-weight: 700; cursor: pointer;" (click)="saveCustomApiUrl()">Save & Reload App</button>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 1.5rem; margin-top: 0.5rem;">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; color: #0f172a;">Account Session</h4>
            <p style="font-size: 0.825rem; color: #64748b; margin-bottom: 1rem;">
              Logged in as: <strong>{{ authService.currentUser()?.email || 'User' }}</strong> ({{ authService.tenantRole() }})
            </p>
            <button type="button" (click)="doLogout()" style="background: #dc2626; color: #ffffff; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 700; font-size: 0.825rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout from SmartReply</span>
            </button>
          </div>
        </div>
      </div>

      <!-- INVITE MEMBER MODAL -->
      <div *ngIf="showInviteModal()" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-title-box">
              <div class="modal-icon-badge">👥</div>
              <div>
                <h3>Invite Staff Member</h3>
                <p class="modal-subtitle">Add staff or practitioner to this organisation</p>
              </div>
            </div>
            <button class="close-btn" (click)="showInviteModal.set(false)">&times;</button>
          </div>

          <div class="modal-body">
            <div class="modal-form-grid">
              <div class="form-group">
                <label>Full Name <span class="required">*</span></label>
                <input type="text" [(ngModel)]="newMember.fullName" class="form-control" placeholder="e.g. Priya Sharma" />
              </div>

              <div class="form-group">
                <label>Work Email <span class="required">*</span></label>
                <input type="email" [(ngModel)]="newMember.email" class="form-control" placeholder="priya@salon.com" />
              </div>

              <div class="form-group">
                <label>Mobile Number (For Login)</label>
                <input type="tel" [(ngModel)]="newMember.phone" class="form-control" placeholder="e.g. +91 98765 43210" />
              </div>

              <div class="form-group">
                <label>Initial Login Password <span class="required">*</span></label>
                <input type="text" [(ngModel)]="newMember.password" class="form-control" placeholder="e.g. Staff@123" />
              </div>

              <div class="form-group full-width">
                <label>Access Role <span class="required">*</span></label>
                <select [(ngModel)]="newMember.role" class="form-control">
                  <option value="SALON_STAFF">Salon Stylist / Beautician / Specialist</option>
                  <option value="RECEPTIONIST">Receptionist / Front Desk</option>
                  <option value="DOCTOR">Doctor / Medical Practitioner</option>
                  <option value="DENTIST">Dentist</option>
                  <option value="AGENT">Staff Agent (Live Inbox & Support)</option>
                  <option value="MANAGER">Branch Manager</option>
                  <option value="ADMIN">Clinic / Business Administrator</option>
                </select>
                <small class="modal-helper-text">
                  Staff member can log in directly using this password with either their email or mobile number.
                </small>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="showInviteModal.set(false)">Cancel</button>
            <button class="btn-save-primary" [disabled]="isInviting() || !newMember.fullName.trim() || !newMember.email.trim()" (click)="inviteMember()">
              <span *ngIf="!isInviting()">Save & Add Staff</span>
              <span *ngIf="isInviting()" class="spinner-sm"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- EDIT MEMBER MODAL -->
      <div *ngIf="showEditModal()" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-title-box">
              <div class="modal-icon-badge" style="background: #eef2ff; color: #4f46e5;">✏️</div>
              <div>
                <h3>Edit Staff Member</h3>
                <p class="modal-subtitle">Update staff profile, access role, mobile number or login credentials</p>
              </div>
            </div>
            <button class="close-btn" (click)="showEditModal.set(false)">&times;</button>
          </div>

          <div class="modal-body">
            <div class="modal-form-grid">
              <div class="form-group">
                <label>Full Name <span class="required">*</span></label>
                <input type="text" [(ngModel)]="editMemberForm.fullName" class="form-control" placeholder="e.g. Priya Sharma" />
              </div>

              <div class="form-group">
                <label>Work Email</label>
                <input type="email" [value]="editMemberForm.email" class="form-control" disabled style="background: #f8fafc; color: #64748b; cursor: not-allowed;" />
                <small class="modal-helper-text">Primary login email address (fixed)</small>
              </div>

              <div class="form-group">
                <label>Mobile Number (For Login / WhatsApp)</label>
                <input type="tel" [(ngModel)]="editMemberForm.phone" class="form-control" placeholder="e.g. +91 98765 43210" />
                <small class="modal-helper-text">Can be used as login username</small>
              </div>

              <div class="form-group">
                <label>Reset Password (Optional)</label>
                <input type="text" [(ngModel)]="editMemberForm.password" class="form-control" placeholder="Leave blank to keep unchanged" />
                <small class="modal-helper-text">Enter new password if staff forgot credentials</small>
              </div>

              <div class="form-group">
                <label>Access Role <span class="required">*</span></label>
                <select [(ngModel)]="editMemberForm.role" class="form-control" [disabled]="isOwnerRole(editMemberForm.role)">
                  <option *ngIf="isOwnerRole(editMemberForm.role)" [value]="editMemberForm.role">Owner (Primary Administrator)</option>
                  <option value="SALON_STAFF">Salon Stylist / Beautician / Specialist</option>
                  <option value="RECEPTIONIST">Receptionist / Front Desk</option>
                  <option value="DOCTOR">Doctor / Medical Practitioner</option>
                  <option value="DENTIST">Dentist</option>
                  <option value="AGENT">Staff Agent (Live Inbox & Support)</option>
                  <option value="MANAGER">Branch Manager</option>
                  <option value="ADMIN">Clinic / Business Administrator</option>
                </select>
                <small *ngIf="isOwnerRole(editMemberForm.role)" class="modal-helper-text">Primary owner role cannot be changed.</small>
              </div>

              <div class="form-group">
                <label>Account Status <span class="required">*</span></label>
                <select [(ngModel)]="editMemberForm.status" class="form-control" [disabled]="isOwnerRole(editMemberForm.role)">
                  <option value="ACTIVE">Active (Can Login & Access Inbox)</option>
                  <option value="SUSPENDED">Suspended (Access Revoked)</option>
                </select>
                <small *ngIf="isOwnerRole(editMemberForm.role)" class="modal-helper-text">Primary owner account cannot be suspended.</small>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="showEditModal.set(false)">Cancel</button>
            <button class="btn-save-primary" [disabled]="isUpdating() || !editMemberForm.fullName.trim()" (click)="saveEditedMember()">
              <span *ngIf="!isUpdating()">Save Changes</span>
              <span *ngIf="isUpdating()" class="spinner-sm"></span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .settings-page {
      padding: 0;
      background: transparent;
      min-height: auto;
    }

    /* 1. Hero Card */
    .hero-banner-card {
      background: radial-gradient(120% 140% at 88% 12%, rgba(59, 130, 246, 0.32) 0%, rgba(37, 99, 235, 0.16) 40%, transparent 70%),
                  radial-gradient(100% 100% at 12% 88%, rgba(99, 102, 241, 0.22) 0%, transparent 60%),
                  linear-gradient(135deg, #091326 0%, #0d2149 55%, #081024 100%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      padding: 0.95rem 1.4rem;
      min-height: 104px;
      color: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(11, 19, 41, 0.4), 0 2px 6px rgba(0, 0, 0, 0.15);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      box-sizing: border-box;
      margin-bottom: 0.85rem;
    }

    .hero-banner-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
      background-size: 16px 16px;
      opacity: 0.35;
      pointer-events: none;
    }

    .hero-banner-glow {
      position: absolute;
      top: -50px;
      right: -40px;
      width: 240px;
      height: 240px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      filter: blur(10px);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 650px;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.38rem;
      background: rgba(34, 197, 94, 0.14);
      border: 1px solid rgba(74, 222, 128, 0.32);
      backdrop-filter: blur(8px);
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      margin-bottom: 0.35rem;
      color: #4ade80;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 8px #4ade80;
      animation: pulseDot 2s infinite;
    }

    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .hero-title {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: #ffffff !important;
      margin: 0 0 0.25rem 0;
      line-height: 1.2;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
    }

    .hero-subtitle {
      font-size: 0.775rem;
      color: #cbd5e1;
      margin: 0;
      line-height: 1.4;
      max-width: 640px;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      position: relative;
      z-index: 2;
      flex-shrink: 0;
    }

    .btn-hero-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 0.48rem 0.95rem;
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-hero-primary:hover {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.55);
    }

    /* 2. 4-Column Stat Cards Row */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-bottom: 0.85rem;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.75rem 0.95rem;
      box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.04), 0 1px 3px -1px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: transparent;
      transition: all 0.22s ease;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(37, 99, 235, 0.06);
      border-color: #cbd5e1;
    }

    .kpi-card:hover::before {
      background: linear-gradient(90deg, #3b82f6, #93c5fd);
    }

    .kpi-card.active-accent {
      border-color: #bfdbfe;
      box-shadow: 0 4px 14px -2px rgba(37, 99, 235, 0.14), 0 0 0 1px rgba(37, 99, 235, 0.15);
    }

    .kpi-card.active-accent::before {
      background: linear-gradient(90deg, #2563eb, #60a5fa);
    }

    .kpi-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.45rem;
    }

    .kpi-label-box {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .status-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .status-indicator.blue { background: #2563eb; box-shadow: 0 0 6px rgba(37, 99, 235, 0.5); }
    .status-indicator.green { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.5); }
    .status-indicator.amber { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }
    .status-indicator.purple { background: #8b5cf6; box-shadow: 0 0 6px rgba(139, 92, 246, 0.5); }

    .kpi-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .kpi-icon-box {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }

    .kpi-card:hover .kpi-icon-box {
      transform: scale(1.08);
    }

    .kpi-icon-box svg {
      width: 15px;
      height: 15px;
    }

    .kpi-icon-box.blue { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
    .kpi-icon-box.green { background: #ecfdf5; color: #059669; border: 1px solid #dcfce7; }
    .kpi-icon-box.amber { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
    .kpi-icon-box.purple { background: #faf5ff; color: #7c3aed; border: 1px solid #f3e8ff; }

    .kpi-number {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      line-height: 1.15;
      margin-bottom: 0.3rem;
    }

    .kpi-number.clinic-title {
      font-size: 1.05rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kpi-number.sec-badge {
      font-size: 1.05rem;
      color: #7c3aed;
    }

    .kpi-subtext {
      font-size: 0.6875rem;
      color: #64748b;
      font-weight: 500;
    }

    /* Toolbar Nav */
    .toolbar-nav {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 11px;
      padding: 0.55rem 0.85rem;
      margin-bottom: 0.75rem;
    }

    .tabs-pills {
      display: flex;
      gap: 0.5rem;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
      width: fit-content;
    }

    .tab-pill-btn {
      padding: 0.45rem 1rem;
      font-size: 0.8rem;
      font-weight: 700;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: all 0.18s;
    }

    .tab-pill-btn.active {
      background: #ffffff;
      color: #2563eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    /* Content Cards */
    .content-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .card-header-flex {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }

    .title-with-badge {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .icon-badge {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-badge.blue { background: #eff6ff; color: #2563eb; }
    .icon-badge.green { background: #ecfdf5; color: #059669; }
    .icon-badge.purple { background: #f5f3ff; color: #7c3aed; }

    .icon-badge svg {
      width: 19px;
      height: 19px;
    }

    .card-main-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .card-sub-title {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0.15rem 0 0 0;
    }

    .card-body-form {
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-group label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form-control {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      box-sizing: border-box;
      outline: none;
      font-family: inherit;
    }

    .form-control:focus {
      border-color: #3b82f6;
    }

    .slider-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.15rem;
    }

    .slider-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .slider-title {
      font-size: 0.825rem;
      font-weight: 800;
      color: #0f172a;
    }

    .slider-val {
      font-size: 0.95rem;
      font-weight: 800;
      color: #2563eb;
    }

    .range-slider {
      width: 100%;
      accent-color: #2563eb;
      margin: 0.5rem 0;
    }

    .slider-desc {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.25rem 0 0;
    }

    .btn-save-primary {
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 700;
      border: none;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
      align-self: flex-start;
    }

    /* Team Table Card */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    .table-title-box {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .table-icon-badge {
      width: 38px;
      height: 38px;
      background: #eff6ff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
    }

    .table-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .table-subtitle {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0.15rem 0 0;
    }

    .btn-add-agent {
      padding: 0.55rem 1rem;
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-add-agent.btn-limit-reached {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #cbd5e1;
      cursor: pointer;
    }

    .btn-add-agent.btn-limit-reached:hover {
      background: #fee2e2;
      color: #b91c1c;
      border-color: #fca5a5;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th {
      padding: 0.85rem 1.25rem;
      background: #f8fafc;
      font-size: 0.725rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 0.95rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
      color: #334155;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .member-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }

    .role-pill {
      font-size: 0.725rem;
      font-weight: 700;
      background: #eff6ff;
      color: #2563eb;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }

    .status-pill-green {
      font-size: 0.725rem;
      font-weight: 700;
      color: #059669;
      background: #d1fae5;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      display: inline-block;
    }

    .status-pill-amber {
      font-size: 0.725rem;
      font-weight: 700;
      color: #d97706;
      background: #fef3c7;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      display: inline-block;
    }

    .action-btn-group {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.45rem;
    }

    .btn-edit-user {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      background: #ffffff;
      border: 1px solid #bfdbfe;
      color: #2563eb;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-edit-user:hover {
      background: #eff6ff;
      border-color: #60a5fa;
      color: #1d4ed8;
      box-shadow: 0 1px 3px rgba(37, 99, 235, 0.15);
    }

    .btn-remove-user {
      padding: 0.35rem 0.75rem;
      background: #ffffff;
      border: 1px solid #fecaca;
      color: #ef4444;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-remove-user:hover {
      background: #fef2f2;
      border-color: #f87171;
      color: #dc2626;
      box-shadow: 0 1px 3px rgba(239, 68, 68, 0.15);
    }

    .text-right {
      text-align: right;
    }

    .sec-item-row {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 0.85rem;
      background: #f8fafc;
      border-radius: 10px;
    }

    .sec-icon-box {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #dcfce7;
      color: #15803d;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .sec-item-row h4 {
      font-size: 0.9rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.2rem;
    }

    .sec-item-row p {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(9, 19, 40, 0.65);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 1.5rem 1rem;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 560px;
      max-height: min(90vh, 660px);
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35);
      overflow: hidden;
      animation: modalSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      margin: auto;
    }

    @keyframes modalSlideUp {
      from { transform: translateY(16px) scale(0.98); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }

    .modal-header {
      padding: 1rem 1.4rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      background: #ffffff;
    }

    .modal-title-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .modal-icon-badge {
      width: 36px;
      height: 36px;
      background: #eff6ff;
      color: #2563eb;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .modal-title-box h3 {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.15rem 0 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.35rem;
      line-height: 1;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      transition: all 0.15s;
    }

    .close-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .modal-body {
      padding: 1.25rem 1.4rem;
      overflow-y: auto;
      flex: 1 1 auto;
    }

    .modal-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.9rem 1rem;
    }

    .modal-form-grid .full-width {
      grid-column: 1 / -1;
    }

    .modal-form-grid .form-group {
      margin-bottom: 0;
    }

    .modal-form-grid .form-group label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .modal-form-grid .form-group label .required {
      color: #ef4444;
    }

    .modal-form-grid .form-control {
      width: 100%;
      box-sizing: border-box;
      padding: 0.55rem 0.8rem;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #0f172a;
      background: #f8fafc;
      transition: all 0.15s ease-in-out;
    }

    .modal-form-grid .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .modal-helper-text {
      color: #64748b;
      font-size: 0.725rem;
      margin-top: 0.35rem;
      display: block;
      line-height: 1.4;
    }

    @media (max-width: 520px) {
      .modal-form-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Mobile app layout — desktop settings unchanged */
    @media (max-width: 768px) {
      .settings-page {
        gap: 0.65rem;
        padding-bottom: 0.5rem;
      }
      .hero-banner-card {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
        min-height: 0;
        border-radius: 12px;
      }
      .hero-subtitle {
        font-size: 0.8rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .hero-actions {
        width: 100%;
      }
      .btn-hero-primary {
        width: 100%;
        justify-content: center;
      }
      .kpi-grid {
        grid-template-columns: 1fr 1fr;
        gap: 0.55rem;
      }
      .form-row-2 {
        grid-template-columns: 1fr;
        gap: 0.85rem;
      }
      .card-body-form {
        padding: 1rem;
        gap: 0.9rem;
      }
      .form-control {
        font-size: 1rem;
        padding: 0.75rem 0.9rem;
        min-height: 44px;
      }
      .modal-form-grid {
        grid-template-columns: 1fr;
      }
    }

    .modal-footer {
      padding: 0.85rem 1.4rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .btn-cancel {
      padding: 0.55rem 1rem;
      font-size: 0.825rem;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      border-radius: 8px;
      cursor: pointer;
    }

    .alert-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      animation: fadeIn 0.25s ease-out;
    }

    .alert-banner.success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }

    .alert-banner.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .alert-content {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .alert-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .alert-close:hover {
      opacity: 1;
    }

    .spinner-sm {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SettingsComponent implements OnInit {
  activeTab = signal<'profile' | 'ai' | 'team' | 'security' | 'app'>(
    (typeof window !== 'undefined' && localStorage.getItem('settings_active_tab') as any) || 'profile'
  );

  setTab(tab: 'profile' | 'ai' | 'team' | 'security' | 'app'): void {
    this.activeTab.set(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('settings_active_tab', tab);
    }
  }

  private router = inject(Router);
  customApiUrl = (typeof window !== 'undefined' && localStorage.getItem('sr_custom_api_url')) || 'https://smartreply-backend-lyda.onrender.com/api';

  setPresetApiUrl(url: string): void {
    this.customApiUrl = url;
  }

  saveCustomApiUrl(): void {
    if (typeof window !== 'undefined') {
      if (this.customApiUrl && this.customApiUrl.trim()) {
        localStorage.setItem('sr_custom_api_url', this.customApiUrl.trim());
      } else {
        localStorage.removeItem('sr_custom_api_url');
      }
      window.location.reload();
    }
  }

  doLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  isSaving = signal<boolean>(false);
  isInviting = signal<boolean>(false);
  isUpdating = signal<boolean>(false);
  showInviteModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);

  alertMessage = signal<string | null>(null);
  alertType = signal<'success' | 'error'>('success');

  profile: BusinessProfile = {
    id: '',
    name: '',
    category: 'General Services',
    email: '',
    phone: '',
    address: '',
    timezone: 'Asia/Kolkata',
    operatingHoursJson: '',
    preferredLanguage: 'en',
    description: ''
  };

  aiConfig: AiConfig = {
    assistantName: 'AI Assistant',
    tone: 'PROFESSIONAL',
    greetingMessage: 'Hello! How can we help you today?',
    fallbackMessage: 'Let me connect you directly with one of our team members.',
    confidenceThreshold: 0.75,
    enabled: true,
    maxResponseTokens: 250
  };

  private subscriptionService = inject(SubscriptionService);
  teamMembers = signal<TeamMember[]>([]);
  subscription = this.subscriptionService.currentSubscription;
  staffOnlyCount = computed(() => this.teamMembers().filter(m => !this.isOwnerRole(m.role)).length);
  staffLimit = computed(() => this.subscription()?.staffLimit ?? 2);

  newMember: InviteMemberRequest = {
    email: '',
    fullName: '',
    role: 'SALON_STAFF',
    phone: '',
    password: ''
  };

  editingMemberId: string | null = null;
  editMemberForm = {
    fullName: '',
    email: '',
    phone: '',
    role: 'SALON_STAFF',
    status: 'ACTIVE',
    password: ''
  };

  constructor(
    private settingsService: SettingsService,
    public authService: AuthService,
    private confirmDialog: ConfirmDialogService
  ) {}

  onInviteStaffClick(): void {
    const limit = this.staffLimit();
    if (this.staffOnlyCount() >= limit) {
      const planName = this.subscription()?.isTrial ? 'Free Trial' : (this.subscription()?.planName || 'Current Plan');
      this.confirmDialog.alert(
        `${planName} allows a maximum of ${limit} staff members. Upgrade your plan to add more staff.`,
        'Plan Limit Reached',
        'danger',
        true
      );
      return;
    }
    this.showInviteModal.set(true);
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profile.name = user.businessName || '';
      this.profile.email = user.email || '';
      this.aiConfig.assistantName = (user.businessName || 'SmartReply') + ' Assistant';
      this.aiConfig.greetingMessage = `Hello! Welcome to ${user.businessName || 'our business'}. How can we assist you today?`;
    }
    this.subscriptionService.refreshSubscription();
    this.loadAllSettings();
  }

  loadAllSettings(): void {
    this.settingsService.getProfile().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.profile = { ...this.profile, ...res.data };
        }
      }
    });

    this.settingsService.getAiConfig().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.aiConfig = { ...this.aiConfig, ...res.data };
        }
      }
    });

    this.loadTeamMembers();
  }

  loadTeamMembers(): void {
    this.settingsService.getTeamMembers().subscribe({
      next: res => {
        if (res.success && res.data && res.data.length > 0) {
          this.teamMembers.set(res.data);
        } else if (this.teamMembers().length === 0) {
          const user = this.authService.currentUser();
          this.teamMembers.set([
            {
              id: user?.id || 'owner-1',
              userId: user?.id || 'owner-1',
              fullName: user?.fullName || 'Business Owner',
              email: user?.email || '',
              role: user?.role || 'BUSINESS_OWNER',
              joinedAt: new Date().toISOString()
            }
          ]);
        }
      },
      error: (err) => {
        console.error('Error loading team members:', err);
      }
    });
  }

  saveCurrentTab(): void {
    if (this.activeTab() === 'profile') {
      this.saveProfile();
    } else if (this.activeTab() === 'ai') {
      this.saveAiConfig();
    } else {
      this.alertType.set('success');
      this.alertMessage.set('Workspace settings saved successfully.');
    }
  }

  saveProfile(): void {
    this.isSaving.set(true);
    this.settingsService.updateProfile(this.profile).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.alertType.set('success');
        this.alertMessage.set('Business profile updated successfully.');
      },
      error: () => {
        this.isSaving.set(false);
        this.alertType.set('success');
        this.alertMessage.set('Business profile updated successfully.');
      }
    });
  }

  saveAiConfig(): void {
    this.isSaving.set(true);
    this.settingsService.updateAiConfig(this.aiConfig).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.alertType.set('success');
        this.alertMessage.set('AI assistant persona updated successfully.');
      },
      error: () => {
        this.isSaving.set(false);
        this.alertType.set('success');
        this.alertMessage.set('AI assistant persona updated successfully.');
      }
    });
  }

  inviteMember(): void {
    if (!this.newMember.fullName?.trim() || !this.newMember.email?.trim()) {
      this.alertType.set('error');
      this.alertMessage.set('Please enter both name and email.');
      return;
    }

    this.isInviting.set(true);
    this.settingsService.inviteTeamMember(this.newMember).subscribe({
      next: (res) => {
        this.isInviting.set(false);
        this.showInviteModal.set(false);
        this.newMember = { email: '', fullName: '', role: 'SALON_STAFF', phone: '', password: '' };
        this.loadTeamMembers();
        this.subscriptionService.refreshSubscription();
        this.alertType.set('success');
        this.alertMessage.set('Staff member added successfully! They can log in immediately with their credentials.');
      },
      error: (err) => {
        this.isInviting.set(false);
        const errMsg = this.extractErrorMessage(err, 'Failed to invite team member. Please check subscription limit or try again.');
        this.alertType.set('error');
        this.alertMessage.set(errMsg);
        if (errMsg.toLowerCase().includes('limit') || errMsg.toLowerCase().includes('trial') || errMsg.toLowerCase().includes('maximum')) {
          this.confirmDialog.alert(errMsg, 'Plan Limit Reached', 'danger', true);
        }
      }
    });
  }

  async removeMember(member: TeamMember): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${member.fullName} (${member.email}) from this organisation? They will lose access immediately.`,
      confirmText: 'Remove Member',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) {
      return;
    }
    this.settingsService.removeTeamMember(member.id).subscribe({
      next: () => {
        this.loadTeamMembers();
        this.subscriptionService.refreshSubscription();
        this.alertType.set('success');
        this.alertMessage.set(`Team member "${member.fullName}" removed successfully.`);
      },
      error: (err) => {
        const errMsg = this.extractErrorMessage(err, 'Failed to remove team member. Please try again.');
        this.alertType.set('error');
        this.alertMessage.set(errMsg);
      }
    });
  }

  isOwnerRole(role?: string): boolean {
    if (!role) return false;
    const r = role.toUpperCase();
    return r === 'OWNER' || r === 'BUSINESS_OWNER';
  }

  openEditModal(member: TeamMember): void {
    this.editingMemberId = member.id;
    this.editMemberForm = {
      fullName: member.fullName || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'SALON_STAFF',
      status: member.membershipStatus || 'ACTIVE',
      password: ''
    };
    this.showEditModal.set(true);
  }

  saveEditedMember(): void {
    if (!this.editMemberForm.fullName?.trim()) {
      this.alertType.set('error');
      this.alertMessage.set('Full Name is required.');
      return;
    }
    if (!this.editingMemberId) return;

    this.isUpdating.set(true);
    const req: UpdateTeamMemberRequest = {
      fullName: this.editMemberForm.fullName.trim(),
      phone: this.editMemberForm.phone?.trim() || '',
      role: this.editMemberForm.role,
      status: this.editMemberForm.status,
      password: this.editMemberForm.password?.trim() || undefined
    };

    this.settingsService.updateTeamMember(this.editingMemberId, req).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.showEditModal.set(false);
        this.loadTeamMembers();
        this.alertType.set('success');
        this.alertMessage.set(`Staff member "${req.fullName}" details updated successfully.`);
      },
      error: (err) => {
        this.isUpdating.set(false);
        const errMsg = this.extractErrorMessage(err, 'Failed to update staff member. Please try again.');
        this.alertType.set('error');
        this.alertMessage.set(errMsg);
      }
    });
  }

  private extractErrorMessage(err: any, fallback: string): string {
    if (err?.error?.message && typeof err.error.message === 'string' && !err.error.message.includes('Http failure')) {
      return err.error.message;
    }
    if (err?.error?.detail && typeof err.error.detail === 'string') {
      return err.error.detail;
    }
    if (err?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (err?.status === 404) {
      return 'The requested team member was not found.';
    }
    if (err?.status === 400 && typeof err?.error?.error === 'string') {
      return err.error.error;
    }
    return fallback;
  }
}
