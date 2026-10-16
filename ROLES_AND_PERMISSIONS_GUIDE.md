# SmartReply AI — Roles & Access Control (RBAC) Guide

This document outlines the multi-user role hierarchy, module access rules, and data privacy boundaries implemented in **SmartReply AI**.

---

## 1. Overview & Security Architecture

SmartReply AI implements a dual-layer security model:
1. **Multi-Tenant Row-Level Segregation**: Every database transaction is scoped strictly to the current organization's `business_id` using `TenantContext`. Cross-tenant data leakage is structurally impossible.
2. **Role-Based Access Control (RBAC)**: Within each tenant organization, individual staff members are assigned specific roles that govern which screens, APIs, and actions they are permitted to execute.

---

## 2. Roles & Access Matrix

| Feature / Module | 1. Owner | 2. Admin | 3. Manager | 4. Receptionist | 5. Agent | 6. Doctor / Dentist | 7. Salon Stylist |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dashboard & KPI Overview** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Scoped | ✅ Scoped |
| **Live Inbox (WhatsApp Chat)** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Chat Only | ❌ No | ❌ No |
| **All Appointments (Calendar)** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All | 🩺 Own Patients | ✂️ Own Chair |
| **Book & Reschedule Appointments** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Own Only | ✅ Own Only |
| **Customer Contact Directory (CRM)** | ✅ Full | ✅ Full | ✅ Full | ✅ View/Add | ✅ View/Add | ✅ Patient Roster | ❌ No |
| **Knowledge Base (AI FAQs)** | ✅ Full | ✅ Full | 👁️ View Only | ❌ No | ❌ No | ❌ No | ❌ No |
| **Reports & MRR Revenue Analytics** | ✅ Full | ✅ Full | 👁️ Branch Only | ❌ No | ❌ No | ❌ No | ❌ No |
| **WhatsApp Cloud API Integration** | ✅ Full | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Automations & Triggers** | ✅ Full | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Billing & Subscription Plans** | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Team Management (Invite/Edit Staff)** | ✅ Full | ✅ Limited* | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |

> *\*Note: Admins can manage staff members but can never modify, suspend, or remove the primary Business Owner.*

---

## 3. Detailed Role Breakdown

### 👑 1. Primary Business Owner (`OWNER` / `BUSINESS_OWNER`)
* **Target User**: Clinic Owner, Salon Founder, or Managing Director.
* **Permission Set**: `ALL`
* **Privileges**:
  - Full administrative ownership over the entire business organization.
  - Exclusive access to **Billing & Subscription Plans** (Razorpay checkouts, plan upgrades, invoices).
  - Ability to invite new staff members, edit roles/mobile numbers, and remove members.
  - Full configuration of Meta WhatsApp Cloud API credentials and webhook secrets.
  - Autonomous AI assistant persona tuning, system prompt adjustments, and fallback thresholds.
* **Protection**: Ownership is non-transferable via normal staff endpoints; the primary owner cannot be suspended or deleted.

---

### 🛡️ 2. Business Administrator (`ADMIN` / `BUSINESS_ADMIN`)
* **Target User**: General Manager, Clinic Operations Lead, or IT Admin.
* **Permission Set**: 
  `MANAGE_TEAM`, `MANAGE_BRANCHES`, `MANAGE_SERVICES`, `MANAGE_STAFF`, `MANAGE_APPOINTMENTS`, `VIEW_APPOINTMENTS`, `MANAGE_CUSTOMERS`, `VIEW_CUSTOMERS`, `MANAGE_INBOX`, `MANAGE_AI`, `VIEW_REPORTS`
* **Privileges**:
  - Full access to operational modules (Live Inbox, Appointments, Customer CRM).
  - Can invite and manage staff members (Doctors, Receptionists, Stylists, Agents).
  - Can configure AI Knowledge Base FAQs and prompt training.
  - Can inspect business performance reports and operational analytics.
* **Restrictions**:
  - **No Billing Access**: Cannot view payment cards, change subscriptions, or access billing invoices.
  - **Owner Protection**: Cannot modify, suspend, or remove the primary Business Owner.

---

### 🏢 3. Branch Manager (`MANAGER`)
* **Target User**: Branch Supervisor or Center Manager.
* **Permission Set**:
  `MANAGE_BRANCHES`, `MANAGE_SERVICES`, `MANAGE_STAFF`, `MANAGE_APPOINTMENTS`, `VIEW_APPOINTMENTS`, `MANAGE_CUSTOMERS`, `VIEW_CUSTOMERS`, `MANAGE_INBOX`, `VIEW_REPORTS`
* **Privileges**:
  - Manages appointment bookings and scheduling across all branch staff.
  - Responds to customer inquiries in Live Inbox.
  - Inspects branch-level appointment trends and activity reports.
* **Restrictions**:
  - Cannot access Billing & Plans.
  - Cannot access Workspace Team Management settings (cannot invite or delete staff).
  - Cannot modify WhatsApp API credentials or core AI system configuration.

---

### 🛎️ 4. Receptionist / Front Desk (`RECEPTIONIST`)
* **Target User**: Front Desk Executive, Receptionist, or Tele-calling Staff.
* **Permission Set**:
  `MANAGE_APPOINTMENTS`, `VIEW_APPOINTMENTS`, `MANAGE_CUSTOMERS`, `VIEW_CUSTOMERS`, `MANAGE_INBOX`
* **Privileges**:
  - **Appointments**: View central clinic/salon calendar, book walk-in customers, reschedule, and mark attendance.
  - **Live Inbox**: Communicate directly with patients/customers over WhatsApp chat.
  - **Customers**: Register new customer profiles, view phone numbers and notes.
* **Restrictions**:
  - No access to financial/MRR reports.
  - No access to Billing, Team settings, WhatsApp API integration, or AI FAQ tuning.

---

### 💬 5. Staff Agent (`AGENT`)
* **Target User**: Customer Care Agent, Live Chat Support Representative.
* **Permission Set**:
  `MANAGE_INBOX`, `VIEW_APPOINTMENTS`, `VIEW_CUSTOMERS`, `MANAGE_APPOINTMENTS`
* **Privileges**:
  - Manage live chat conversations handed off by the AI assistant.
  - Check customer availability and book consultation appointments during chat.
* **Restrictions**:
  - Strictly limited to front-line customer engagement.
  - No access to System Settings, Billing, Reports, or AI Prompt configuration.

---

### 🩺 6. Doctor / Dentist (`DOCTOR` / `DENTIST`)
* **Target User**: Consulting Physician, Surgeon, Dentist, Clinical Specialist.
* **Permission Set**:
  `VIEW_APPOINTMENTS`, `MANAGE_OWN_APPOINTMENTS`, `VIEW_CUSTOMERS`
* **Privileges**:
  - **Scoped Privacy Protection**: Can view appointments booked specifically under their practitioner profile.
  - Can mark their own consultations as `COMPLETED` and record clinical notes.
  - Can access the medical/consultation history of their assigned patients.
* **Restrictions**:
  - Cannot inspect appointments of other doctors/practitioners.
  - No access to Live Inbox, Financial Reports, Billing, or Team settings.

---

### ✂️ 7. Salon Stylist / Beautician (`SALON_STAFF`)
* **Target User**: Hair Stylist, Esthetician, Nail Technician, Spa Therapist.
* **Permission Set**:
  `VIEW_APPOINTMENTS`, `MANAGE_OWN_APPOINTMENTS`
* **Privileges**:
  - View personal daily appointment queue for their styling chair.
  - Mark services as completed upon finishing treatment.
* **Restrictions**:
  - Cannot view other stylists' schedules or customer CRM database.
  - No access to revenue reports, billing, or organization configurations.

---

## 4. Multi-Identifier Login Support

Every staff account created in the system supports dual-identifier authentication:
1. **Email Address** + Password
2. **Mobile Number** + Password

```
User logs in (Email / Mobile + Password)
          │
          ▼
   Auth Service & JWT
          │
          ▼
  Determine Tenant & Role (e.g. DOCTOR, RECEPTIONIST)
          │
          ▼
  Redirect to Scoped Dashboard (Filtered UI & Navigation)
```

---

## 5. Code Implementation Map

| Layer | File Reference | Functionality |
|---|---|---|
| **Role Definitions** | [`TenantRole.java`](backend/src/main/java/com/smartreplyai/security/TenantRole.java) | Enum declaring allowed permission sets per role |
| **Security Service** | [`TenantSecurityService.java`](backend/src/main/java/com/smartreplyai/security/TenantSecurityService.java) | Spring Security bean used in `@PreAuthorize` rules |
| **Context Scoping** | [`TenantContext.java`](backend/src/main/java/com/smartreplyai/tenant/TenantContext.java) | ThreadLocal tenant context containing tenant ID & role |
| **API Controller** | [`SettingsController.java`](backend/src/main/java/com/smartreplyai/settings/SettingsController.java) | Endpoints to invite, edit, suspend, and remove staff |
| **Staff Service** | [`SettingsService.java`](backend/src/main/java/com/smartreplyai/settings/SettingsService.java) | Business logic synchronizing `User`, `BusinessMember`, and `Staff` |
| **Frontend Auth** | [`auth.service.ts`](frontend/src/app/core/services/auth.service.ts) | Role computations (`canManageSettings`, `canManageBilling`) |
| **Navigation Menu** | [`sidebar.component.ts`](frontend/src/app/layout/sidebar/sidebar.component.ts) | Dynamic menu filtering based on user permissions |

---

## 6. How to Manage Staff (Owner Guide)

1. Open **Workspace Settings** (`http://localhost:4201/settings`).
2. Switch to the **Staff & Agents** tab.
3. **To Invite Staff**: Click **`+ Invite Staff Member`**, enter Name, Email, Mobile Number, initial Password, and select the Access Role.
4. **To Edit Staff**: Click the **`Edit`** button on any staff row to update their name, mobile number, role, status (Active/Suspended), or reset their password.
5. **To Remove Staff**: Click **`Remove`** (Owner accounts are automatically protected from removal).
