# SmartReply AI — Enterprise WhatsApp Business Platform & SaaS Automation

> **SmartReply AI** is an AI-powered WhatsApp customer support, business automation, and unified omnichannel messaging SaaS platform built for clinics, dental hospitals, salons, spas, educational institutions, real estate agencies, retail shops, and professional service firms.

---

## 🏛️ System Architecture

```
   ┌────────────────────────────────────────────────────────┐
   │                  Angular 19 SPA (Port 4200)             │
   │   Signals · Standalone Components · Reactive Forms      │
   │   Design Tokens · Chart.js · 3-Panel Unified Inbox     │
   └───────────────────────────┬────────────────────────────┘
                               │ HTTP / JWT / X-Business-Id
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │             Spring Boot 3.3.4 (Port 8080)              │
   │   Spring Security 6 (Stateless JWT & Strict RBAC)       │
   │   TenantContext & TenantFilter (Tenant Isolation)       │
   │   Flyway Database Migrations (V1 to V5)                │
   │   WhatsApp Cloud API Webhooks & SHA-256 Verification    │
   │   Pluggable AI Engine (RuleBased & LLM Provider)        │
   │   Appointment Collision Checker & Automation Engine     │
   │   Razorpay Payment Order & Webhook Signature Validation │
   └───────────────────────────┬────────────────────────────┘
                               │ JDBC / HikariCP Pool
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │            PostgreSQL 16 Database (Port 5432)          │
   │   Strict Foreign Keys · UUIDs · Composite Indexes      │
   └────────────────────────────────────────────────────────┘
```

---

## 🌟 Production Modules Implemented (Modules 1 - 15)

### 1. Authentication & Security
- User registration, login, profile inspection (`/api/auth/me`).
- BCrypt salt-hashed passwords and stateless HMAC-SHA256 JWT tokens.
- Strict Role-Based Access Control (`SUPER_ADMIN`, `BUSINESS_OWNER`, `BUSINESS_AGENT`).
- Dedicated `TenantContext` enforcing tenant isolation across all entity repositories.

### 2. Guided Business Onboarding
- Guided wizard collecting business details, category, operating hours, timezone, and description.
- Interactive setup progress checklist (business profile, FAQ knowledge, WhatsApp integration, AI configuration, assistant testing).

### 3. Executive SaaS Dashboard
- Real-time statistics: total conversations, open threads, unanswered inquiries, resolution rate, average response time, AI vs human handling split, upcoming appointments.
- Trend charts powered by Chart.js with date filtering (Today, 7 Days, 30 Days).
- Zero-state and empty-state guidance for newly created businesses.

### 4. Official WhatsApp Cloud API Integration
- End-to-end integration architecture keeping tokens and API keys securely on the backend.
- Full support for Meta WhatsApp Cloud API (`v21.0`): phone number ID, WABA ID, permanent system user access token, app secret.
- Webhook subscription endpoint (`GET /api/webhooks/whatsapp`) with challenge verification token validation.
- Inbound message processing (`POST /api/webhooks/whatsapp`) with HMAC-SHA256 signature verification (`X-Hub-Signature-256`) and idempotency deduplication via `webhook_events`.
- In-app interactive simulator for testing inbound messages and outbound WhatsApp replies without requiring live Meta credentials during local development.

### 5. AI Customer Support Assistant
- AI provider abstraction (`AiProvider` interface) decoupling business logic from underlying AI services.
- Grounded response generation using approved business FAQs and business operating hours to strictly avoid hallucinations.
- Dynamic confidence scoring with configurable threshold (`0.10` - `1.00`).
- Automated human escalation and handoff when questions fall outside the knowledge base.
- Configurable response persona, tone (`PROFESSIONAL`, `FRIENDLY`, `EMPATHETIC`, `CONCISE`), and max response tokens.

### 6. Knowledge Base & FAQ Management
- Complete FAQ CRUD with question categorization and keyword tagging.
- Duplicate question detection to ensure clean knowledge data.
- RFC 4180 compliant CSV bulk import with column validation and live import preview.
- CSV export for knowledge backup.
- In-app AI test drawer to test knowledge grounding queries against the live knowledge base.

### 7. Unified 3-Panel Customer Inbox
- **Left Panel**: Conversation list, contact name, phone, last message preview, unread count badge, assigned agent, status filter tabs (All, Open, Resolved).
- **Middle Panel**: Full message stream with distinct bubble themes for Customer, AI Assistant, and Human Agent; delivery receipts (`SENT`, `DELIVERED`, `READ`); interactive reply composer with 1-click AI reply suggestion chips.
- **Right Panel**: Detailed customer profile, tags, assigned staff, internal conversation notes, quick appointment bookings.

### 8. Appointment Management
- Appointment scheduling with customer binding, service types, staff assignment, and custom notes.
- Double-booking conflict detector rejecting overlapping appointments for the same staff/service within operating hours.
- Day and Week views, status transitions (`CONFIRMED`, `COMPLETED`, `CANCELLED`).

### 9. Automation Rules Engine
- Rule builder supporting triggers:
  - `FIRST_MESSAGE_RECEIVED` (Welcome greetings)
  - `APPOINTMENT_CONFIRMED` (Confirmation dispatch)
  - `AI_FALLBACK_TRIGGERED` (Automated agent assignment)
  - `CONVERSATION_UNANSWERED` (Manager alerting)
- Execution history tracking with timestamped audit logs.

### 10. Customer Relationship Management (CRM)
- Searchable customer directory with phone, email, and custom tags.
- Opt-in and opt-out management respecting WhatsApp messaging regulations.
- CSV export of customer lists.

### 11. Subscription Management & Billing
- Configurable subscription plans:
  - **FREE**: 100 conversations/mo, 1 agent.
  - **STARTER**: ₹499/mo, 500 conversations/mo, 1 agent.
  - **GROWTH**: ₹999/mo, 2,000 conversations/mo, 3 agents, AI reply suggestions, automations.
  - **PRO**: ₹1,999/mo, 10,000 conversations/mo, 10 agents, advanced automation, priority support.
- Real-time conversation usage meter and remaining allowance calculation.
- Integrated payment flow supporting simulated checkout and Razorpay signature verification (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`).
- Transaction history and downloadable invoice records.

### 12. In-App Notifications
- Real-time notifications for new inquiries, unassigned threads, human handoff requests, and billing events.
- Unread badge counters, mark-as-read actions, and direct deep-linking to relevant conversations.

### 13. Reports & Analytics
- Metrics: total conversations, resolution rate, AI automation rate, human workload, average response time, upcoming appointments.
- Exportable CSV report generation.

### 14. Super Admin Management
- Strictly protected by `ROLE_SUPER_ADMIN` in Spring Security.
- Global platform overview: total businesses, active vs suspended tenants, total users, total conversations, estimated Monthly Recurring Revenue (MRR), and active integrations.
- Business tenant directory with one-click suspend and activate toggles.
- Global user directory with business associations.
- Security and activity audit trail viewer.

### 15. Settings & Governance
- Business profile editor: name, category, support email, phone, physical address, timezone, and operating hours.
- AI Assistant persona tuning: custom assistant name, tone selection, greeting message, fallback message, and confidence threshold slider.
- Team collaboration: invite agents or business admins with strict plan agent limit enforcement.
- Security and governance documentation overview.

---

## 🛠️ Technology Stack

| Layer | Component | Details |
|---|---|---|
| **Frontend** | Angular 19 | Standalone components, Signals, Reactive Forms, Router, Chart.js, Vanilla CSS tokens |
| **Backend** | Spring Boot 3.3.4 | Java 17, Spring Web, Spring Security 6, Spring Data JPA, Hibernate 6, Bean Validation |
| **Database** | PostgreSQL 16 | Flyway Migrations (V1 to V5), UTF-8, UUID Primary Keys |
| **Integrations** | WhatsApp Cloud API | Official Meta Graph API v21.0, Webhook HMAC-SHA256, Idempotent event store |
| **Billing** | Razorpay / Simulated | HMAC-SHA256 signature verification, checkout orders, transaction ledger |
| **DevOps** | Docker & Compose | Multi-stage Dockerfiles for Angular & Spring Boot, Nginx reverse proxy |

---

## 🚀 Quick Start Guide

### Prerequisites
- Java 17 or higher
- Node.js 20+ and npm
- Docker and Docker Compose (or local PostgreSQL 16 on port 5432)

### 1. Start PostgreSQL
```bash
docker run -d --name smartreply-postgres -p 5432:5432 \
  -e POSTGRES_DB=smartreply_db \
  -e POSTGRES_USER=smartreply \
  -e POSTGRES_PASSWORD=smartreply_secret \
  postgres:16-alpine
```

### 2. Start Spring Boot Backend
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```
The backend starts on `http://localhost:8080`. Flyway automatically executes migrations:
- `V1__initial_schema.sql` (18 tables)
- `V2__seed_initial_plans.sql` (Default subscription tiers)
- `V3__integration_accounts_and_whatsapp.sql` (WhatsApp credentials & indexes)
- `V4__payment_transactions_and_billing.sql` (Payment transaction history)
- `V5__seed_super_admin.sql` (Platform administrator seed)

### 3. Start Angular Frontend
```bash
cd frontend
npm install
npm start
```
The frontend is accessible at `http://localhost:4200`.

### 4. Run Full Stack with Docker Compose
```bash
docker compose up -d --build
```
- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:8080/api`
- Database: `localhost:5432`

---

## 🔑 Default Credentials for Verification

### Super Admin Account
- **URL**: `http://localhost:4200/auth/login`
- **Email**: `admin@smartreply.ai`
- **Password**: `Admin@12345`
- **Permissions**: Full platform overview, tenant suspension, global user directory, audit trails.

### Business Owner Account (Pre-configured Clinic)
- **URL**: `http://localhost:4200/auth/login`
- **Email**: `rajesh@smilecare.com`
- **Password**: `password123`
- **Business**: SmileCare Dental Hospital
- **Current Plan**: Growth Plan (₹999/mo, 2,000 monthly conversations allowance)
- **Sample Customer**: Meera Joshi (`+919876500111`)

---

## 🧪 Testing

### Backend Unit & Integration Tests (40 Tests)
```bash
cd backend
mvn test
```
All 40 tests execute in ~4.5 seconds with 100% pass rate:
- Authentication & JWT generation
- Multi-tenant isolation filter
- FAQ CRUD, search, and duplicate detection
- AI Knowledge grounding & fallback escalation
- WhatsApp Cloud API webhook signature verification & idempotency
- Appointment collision and double-booking prevention
- Subscription usage meters & plan limit enforcement
- Super Admin platform metrics aggregation & tenant status management
- Settings profile & team member invitation limit enforcement

### Frontend Production Build
```bash
cd frontend
npm run build
```
Generates a lean ~202 kB production bundle with 0 compilation errors.

---

## 💾 PostgreSQL Backup & Restore

### Backup
```bash
docker exec -t smartreply-postgres pg_dump -U smartreply -d smartreply_db > smartreply_backup_$(date +%F).sql
```

### Restore
```bash
docker exec -i smartreply-postgres psql -U smartreply -d smartreply_db < smartreply_backup_2026-10-10.sql
```

---

## 📄 License
SmartReply AI is released under the MIT License.
