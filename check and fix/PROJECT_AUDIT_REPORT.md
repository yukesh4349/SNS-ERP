# 🔍 Complete Project Audit Report — End-to-End Deep Inspection

**Project:** SNS Academy ERP (School Management System)  
**Audit Date:** 2026-08-16 at 22:55 IST  
**Audit Status:** COMPLETE — 100% MODULES & CONNECTIONS INSPECTED  
**Audit Type:** Full-Stack / Security / UI / API / Database / Performance / Architecture / Deployment  
**Audit Mode:** STRICT CHECK ONLY — NO CODE MODIFICATIONS, NO DATA ALTERATIONS  

---

# Executive Summary

The SNS Academy ERP is a multi-role school management platform built on **Next.js 16** (frontend) and **NestJS** (backend), backed by **PostgreSQL via Supabase** and **Prisma ORM**. The system is architected for three core user roles: Administrators/Leaders, Teachers/Faculty, and Parents/Students.

### **Overall Project Health Score: 36 / 100 — CRITICAL: NOT SAFE FOR PRODUCTION DEPLOYMENT**

### Primary High-Risk Findings:
1. **Pervasive Missing Guards & Broken Authentication Pipeline:** Neither `AppModule` nor `main.ts` provides a global `AuthGuard`. Out of 17 controllers, **11 controllers completely lack `@UseGuards(AuthGuard)`**. Endpoints in these controllers are completely unauthenticated. Furthermore, whenever endpoints in these unprotected controllers call `@CurrentUser() user` or `req.user.sub`, `user` is `undefined`, causing **instant unhandled `TypeError` (HTTP 500 crashes)** at runtime.
2. **Complete RBAC Authorization Bypass:** In `backend/src/common/guards/roles.guard.ts`, the guard contains an unconditional `return true;`, granting any authenticated user full administrative control over all protected endpoints (deleting users, creating staff, approving exam results, overriding timetables).
3. **Plaintext Password Storage & Exposure:** Passwords are never hashed (no bcrypt/argon2). Passwords are stored in plaintext in the database and explicitly serialized in API responses (`mapUser()`), with the Admin UI providing a toggle to display plaintext passwords.
4. **Hardcoded Universal Student Password:** New student creation assigns `SNSAC@123` universally.
5. **Sensitive Secret & Key Exposure:** Firebase service account private keys and production Supabase database connection strings containing personal password strings are present on disk.
6. **Unrestricted File Uploads:** `UploadsController` lacks authentication, MIME-type validation, and file size limits, allowing arbitrary file uploads to the server filesystem.
7. **Mocked & Simulated Functionality:** Reports (PDF/Excel exports), transport fleet routes, substitution requests (in `substitution-page.tsx`), teacher assignments/resources, and non-general settings tabs are simulated with `setTimeout` and hardcoded static data.

---

# Issue Summary Matrix

| Severity | Count | Summary of Key Issues |
|---|---:|---|
| 🔴 **Critical** | **10** | RBAC bypass, plaintext passwords, missing AuthGuard across 11 controllers, 500 runtime crashes on `user.sub`, Firebase RSA key on disk, hardcoded universal student PW, unauthenticated file upload |
| 🟠 **High** | **13** | 1-year JWT TTL, weak JWT fallback secrets, IDOR on exam results & attendance, teacher attendance query mismatch, unauthenticated timetable/calendar endpoints, missing env vars in deployment |
| 🟡 **Medium** | **16** | Mocked reports generation, hardcoded transport routes, duplicate `/substitution` vs `/substitutions` navigation, mocked teacher resources, tokens in localStorage, N+1 query in class count, missing database indexes, student role stored as "parent" |
| 🔵 **Low** | **10** | Personal docx certificate in codebase, 6 root debug scripts, browser `alert()` dialogs, hardcoded UI notification dot, console.log in production, Math.random() in user tags and emails |
| ⚪ **Informational** | **5** | Custom HMAC JWT implementation, dual icon libraries (Phosphor + Lucide), missing password reset workflow, undefined superadmin privileges |
| **Total Issues** | **54** | |

---

# Comprehensive Category Breakdown

```
Security & Authorization:   16 issues  (30%)
Backend & Architecture:     14 issues  (26%)
Frontend & UI/UX:           12 issues  (22%)
API & Communication:         5 issues   (9%)
Database & Schema:           4 issues   (7%)
Deployment & Build:          3 issues   (6%)
```

---

# Detailed Findings & Issue Catalog

---

## 🔴 CRITICAL SEVERITY ISSUES (10 ISSUES)

---

### ISSUE-SEC-001: Complete RBAC Authorization Bypass in `RolesGuard`
- **Location:** `backend/src/common/guards/roles.guard.ts` (lines 34–37)
- **Component:** `RolesGuard.canActivate()`
- **Problem:** `RolesGuard` contains a comment *"Temporarily allowing all access as requested by user to fix 403s"* followed by an unconditional `return true;`.
- **Impact:** Any user with a valid JWT (including a student/parent) can execute admin-only endpoints: deleting accounts (`DELETE /users/:id`), approving marks (`POST /exams/results/approve`), promoting students (`POST /settings/promote`), and broadcasting alerts (`POST /notifications/broadcast`).
- **Proof:** `roles.guard.ts` line 37: `return true;` unconditionally executes on every request.

---

### ISSUE-SEC-002: Missing Global AuthGuard & Missing Controller-Level Guards Across 11 Backend Modules
- **Location:** `backend/src/app.module.ts`, `backend/src/main.ts`, and 11 controllers:
  - `attendance.controller.ts`
  - `homework.controller.ts`
  - `exams.controller.ts`
  - `announcements.controller.ts`
  - `calendar.controller.ts`
  - `timetable.controller.ts`
  - `messaging.controller.ts`
  - `substitutions.controller.ts`
  - `teachers.controller.ts`
  - `reports.controller.ts`
  - `uploads.controller.ts`
- **Problem:** There is no global guard registered via `APP_GUARD` in `AppModule` or `app.useGlobalGuards()` in `main.ts`. None of the 11 controllers listed above declare `@UseGuards(AuthGuard)`.
- **Impact:** Every endpoint in these 11 modules is completely accessible to unauthenticated public internet requests without a Bearer token. Anyone can read teacher records, school announcements, schedules, and post new records without logging in.

---

### ISSUE-BKD-001: Runtime 500 Crashes from `@CurrentUser()` and `req.user` in Unprotected Controllers
- **Location:**
  - `backend/src/homework/homework.controller.ts` (`POST /homework` -> `user.sub`)
  - `backend/src/announcements/announcements.controller.ts` (`POST /announcements` -> `user.sub`)
  - `backend/src/calendar/calendar.controller.ts` (`GET /calendar/my-attendance` -> `user.sub`)
  - `backend/src/timetable/timetable.controller.ts` (`GET /timetable/mine` -> `user.sub`, `GET /timetable/next` -> `user.sub`)
  - `backend/src/attendance/attendance.controller.ts` (`GET /attendance/my-class` -> `user.sub`, `GET /attendance/my-attendance` -> `user.sub`)
  - `backend/src/exams/exams.controller.ts` (`GET /exams/results/:studentId` -> `user.role`)
  - `backend/src/messaging/messaging.controller.ts` (`GET /messaging/groups` -> `req.user.sub`, `POST /messaging/groups` -> `req.user.sub`, `POST /messaging/send` -> `req.user.sub`)
- **Problem:** In NestJS, `@CurrentUser()` extracts `req.user`. `req.user` is only populated when `AuthGuard` executes. Because these controllers lack `AuthGuard`, `req.user` is `undefined`.
- **Impact:** Whenever an authenticated frontend or mobile client invokes these routes, Node.js throws `TypeError: Cannot read properties of undefined (reading 'sub')` / `(reading 'role')`, crashing the request with a **500 Internal Server Error**.

---

### ISSUE-BKD-002: `AuthController` Lacks `AuthGuard` — `GET /auth/me`, Password Change, & Profile Requests Crash with 500
- **Location:** `backend/src/auth/auth.controller.ts` (lines 33, 39, 51, 59, 68)
- **Problem:** `AuthController` does not declare `@UseGuards(AuthGuard)`. Routes `GET /auth/me`, `POST /auth/change-password`, `PATCH /auth/profile`, `POST /auth/profile-request`, and `GET /auth/profile-requests/mine` all access `request.user.sub`.
- **Impact:**
  - `GET /auth/me` crashes with 500. `use-auth.tsx` bootstrap fails on initial profile load and only recovers because of a secondary catch-block that falls back to `POST /auth/refresh`.
  - Password changes, profile updates, and profile change requests fail with 500 when triggered by users.

---

### ISSUE-SEC-003: Plaintext Password Storage in Database (No Password Hashing)
- **Location:** `backend/src/users/users.service.ts` (lines 23, 30–35, 380, 401, 408–410)
- **Problem:** Passwords are stored in plaintext strings in the database. `package.json` contains no password hashing dependencies (`bcrypt`, `argon2`, `scrypt`). `auth.service.ts` uses direct string comparison.
- **Impact:** A database breach immediately exposes every administrator, teacher, and student password in cleartext.

---

### ISSUE-SEC-004: Plaintext Passwords Returned in API Responses & Displayed in Frontend UI
- **Location:**
  - `backend/src/users/users.service.ts` (line 477)
  - `frontend/src/components/dashboard/users-page.tsx` (line 891)
- **Problem:** `UsersService.mapUser()` explicitly maps `password: user.password`. Every `GET /users` API call returns all user passwords in the JSON payload. `users-page.tsx` has a button displaying `{showPasswords[user.dbId] ? user.rawUser.password : "••••••••"}`.
- **Impact:** Any user with admin interface access (or through intercepted traffic) can view all user credentials.

---

### ISSUE-SEC-005: Firebase Service Account Private Key File Present in Codebase
- **Location:** `backend/firebase-service-account.json` (lines 1–13)
- **Problem:** Full Firebase Admin SDK service account JSON containing the private RSA key (`-----BEGIN PRIVATE KEY-----...`) is present on disk in the project directory.
- **Impact:** Complete administrative compromise of the Firebase project, push notifications, and connected Google Cloud resources if accessed.

---

### ISSUE-SEC-006: Production Supabase Connection Strings in Backend `.env`
- **Location:** `backend/.env` (lines 10–11)
- **Problem:** Live Supabase pooler and direct PostgreSQL connection strings with embedded passwords containing personal identifying strings are saved in `.env`.
- **Impact:** Direct external database access for anyone with access to the server or filesystem.

---

### ISSUE-SEC-007: Universal Hardcoded Default Student Password
- **Location:** `backend/src/users/users.service.ts` (line 401)
- **Problem:** `createStudent()` assigns `const autoPassword = "SNSAC@123";` regardless of admin input.
- **Impact:** Every newly registered student account shares an identical known password.

---

### ISSUE-SEC-008: Unrestricted Arbitrary File Upload via `UploadsController`
- **Location:** `backend/src/uploads/uploads.controller.ts` (lines 9–36)
- **Problem:** `POST /uploads/:folder` has no `AuthGuard`, no MIME-type filtering, no extension whitelist, and no file size limits. Files are saved directly to `./uploads/{folder}` and served statically at `/uploads/`.
- **Impact:** Public attackers can upload arbitrary scripts, HTML files for stored XSS, or flood the disk causing DoS.

---

## 🟠 HIGH SEVERITY ISSUES (13 ISSUES)

---

### ISSUE-AUTH-001: 1-Year JWT Expiration TTL with No Token Revocation
- **Location:** `backend/.env` (lines 8–9)
- **Problem:** `JWT_EXPIRES_IN=31536000` and `JWT_REFRESH_EXPIRES_IN=31536000` set both access and refresh token lifespans to 365 days.
- **Impact:** Compromised tokens remain valid for 1 year with no blacklist or invalidation mechanism.

---

### ISSUE-AUTH-002: Insecure Default JWT Secrets with Hardcoded Fallbacks
- **Location:** `backend/src/config/app.config.ts` (lines 4–6)
- **Problem:** Fallback secrets default to `'sns-erp-local-access-secret-change-me'` if environment variables are missing.
- **Impact:** Predictable token signing keys allow forged authentication tokens if env vars fail to load.

---

### ISSUE-BKD-003: Teacher Attendance Query Identifier Mismatch
- **Location:**
  - `backend/src/attendance/attendance.service.ts` (lines 14–16)
  - `backend/src/attendance/attendance.controller.ts` (lines 36, 67)
- **Problem:** Marking saves teacher attendance under `employeeId` (e.g. `TCH-2026-0001`), but `getTeacherAttendance()` queries by user UUID (`user.sub`).
- **Impact:** `GET /attendance/my-attendance` always returns 0 records for teachers.

---

### ISSUE-BKD-004: Insecure Direct Object Reference (IDOR) on Exam Results
- **Location:** `backend/src/exams/exams.controller.ts` (lines 22–31)
- **Problem:** `GET /exams/results/:studentId` accepts any student ID with no ownership or parent-student relationship verification.
- **Impact:** Any authenticated user can read all published exam marks of any student.

---

### ISSUE-BKD-005: Insecure Direct Object Reference (IDOR) on Student Attendance
- **Location:** `backend/src/attendance/attendance.controller.ts` (lines 16–22)
- **Problem:** `GET /attendance/student/:studentId` returns attendance records for any arbitrary ID without checking if the requesting user is the student's parent or teacher.
- **Impact:** Student daily attendance data is publicly accessible to any authenticated account.

---

### ISSUE-BKD-006: Dedicated `TeacherAttendance` Database Model Unused
- **Location:** `backend/prisma/schema.prisma` (lines 268–278)
- **Problem:** The schema defines a dedicated `TeacherAttendance` model, but code stores teacher attendance in the student `Attendance` table with `class = 'FACULTY'`.
- **Impact:** Schema redundancy and potential constraint collisions with student IDs.

---

### ISSUE-DEPL-001: Missing Secrets and Environment Declarations in `render.yaml`
- **Location:** `render.yaml` (lines 1–27)
- **Problem:** `render.yaml` only defines `NODE_ENV` and `NODE_OPTIONS`. `DATABASE_URL`, `JWT_SECRET`, `FIREBASE_SERVICE_ACCOUNT`, and `FRONTEND_ORIGIN` are absent.
- **Impact:** Automated deployments fail or revert to insecure hardcoded fallbacks.

---

### ISSUE-DEPL-002: TypeScript & ESLint Errors Suppressed in Production Builds
- **Location:** `frontend/next.config.ts` (lines 4–9)
- **Problem:** `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` are enabled.
- **Impact:** Type errors, undefined object property accesses, and build regressions deploy silently to production.

---

### ISSUE-BKD-007: Duplicate Notification Deletion & Update Routes
- **Location:** `backend/src/notifications/notifications.controller.ts` (lines 28–52)
- **Problem:** Duplicate endpoints exist: `DELETE /:id` vs `POST /delete`, and `PATCH /:id/read` vs `POST /read`.
- **Impact:** Inconsistent API contract and unnecessary attack surface.

---

### ISSUE-SEC-009: Client-Side Firebase Configuration Exposed in `NEXT_PUBLIC_` Env
- **Location:** `frontend/.env` (lines 5–11)
- **Problem:** Firebase client keys and VAPID keys are exposed in client-side bundles without verified Firebase Security Rules.
- **Impact:** Potential unauthorized FCM token registration or project resource abuse.

---

### ISSUE-BKD-008: Unauthenticated Class Timetable Overwrite
- **Location:** `backend/src/timetable/timetable.controller.ts` (lines 44–61)
- **Problem:** `POST /timetable/class` and `PUT /timetable/config` lack `AuthGuard` and `RolesGuard`.
- **Impact:** Any unauthenticated HTTP client can overwrite school-wide period configurations and class timetables.

---

### ISSUE-BKD-009: Unauthenticated Calendar Event Injection
- **Location:** `backend/src/calendar/calendar.controller.ts` (lines 16–19)
- **Problem:** `POST /calendar/events` has `@Roles('admin', 'superadmin')` but no guards are attached to the controller.
- **Impact:** Any anonymous user can inject arbitrary calendar events into the school calendar.

---

### ISSUE-BKD-010: Unauthenticated Group Chat Creation and Messaging
- **Location:** `backend/src/messaging/messaging.controller.ts` (lines 18–44)
- **Problem:** `POST /messaging/groups`, `POST /messaging/groups/:id/members`, and `POST /messaging/send` have no guards.
- **Impact:** Unauthenticated clients can create chat groups or send messages (if `req.user` handling is bypassed or mocked).

---

## 🟡 MEDIUM SEVERITY ISSUES (16 ISSUES)

---

### ISSUE-FE-001: Faked Report Generation with 2-Second Spinner
- **Location:** `frontend/src/components/dashboard/reports-page.tsx` (lines 27–32, 83–97)
- **Problem:** "Generate PDF" and Excel exports use a 2-second `setTimeout` and reset. No backend endpoint is called, and the "Recent Exports" table displays hardcoded mock files.
- **Impact:** Users cannot export real reports.

---

### ISSUE-FE-002: Hardcoded Static Fleet Data in Transport Management
- **Location:** `frontend/src/components/dashboard/transport-page.tsx` (lines 20–25)
- **Problem:** Routes (R-101 to R-104), drivers, and bus statuses are static mock arrays. No transport API exists in the backend.
- **Impact:** Fleet monitoring and route assignment are non-functional.

---

### ISSUE-FE-003: Duplicate Navigation & Mocked Page (`/admin/substitution` vs `/admin/substitutions`)
- **Location:**
  - `frontend/src/components/dashboard/sidebar-nav.tsx` (lines 96, 105)
  - `frontend/src/components/dashboard/substitution-page.tsx`
  - `frontend/src/components/dashboard/substitutions-page.tsx`
- **Problem:** The sidebar contains two links: "Substitutions" (real backend integration) and "Substitution" (fake `setTimeout` mock).
- **Impact:** Confusing duplicate UI and dead code.

---

### ISSUE-FE-004: Non-Deterministic Permissions via `Math.random()` in User Management
- **Location:** `frontend/src/components/dashboard/users-page.tsx` (line 76)
- **Problem:** `features: ["Transport", "Attendance", "Results", "Reports"].filter(() => Math.random() > 0.3)` randomly assigns feature badges on each render.
- **Impact:** Misleading permission badges for administrators.

---

### ISSUE-FE-005: Faked Save Operation for Non-General Settings Tabs
- **Location:** `frontend/src/components/dashboard/settings-page.tsx` (lines 194–198)
- **Problem:** Tabs for Security, Faculty Access, Notifications, Appearance, and Data Management show a fake success toast via `setTimeout` without persisting changes.
- **Impact:** Settings changes outside the General tab are lost on reload.

---

### ISSUE-FE-006: Session Tokens Stored in `localStorage`
- **Location:** `frontend/src/lib/session-storage.ts` (line 10)
- **Problem:** JWT tokens are stored in `window.localStorage` instead of `httpOnly` cookies.
- **Impact:** Tokens are vulnerable to exfiltration via Cross-Site Scripting (XSS).

---

### ISSUE-FE-007: Unverified Multi-Child Linking in `localStorage`
- **Location:** `frontend/src/app/parent-dashboard/page.tsx` (lines 24–42)
- **Problem:** Linked student accounts are read from `localStorage["sns-linked-students"]` without server-side validation.
- **Impact:** A parent could view unauthorized student data by altering localStorage.

---

### ISSUE-FE-008: Mocked Teacher Portal Modules (Assignments, Classes, Resources)
- **Location:**
  - `frontend/src/components/teacher/AssignmentsExams.tsx`
  - `frontend/src/components/teacher/ClassesSubjects.tsx`
  - `frontend/src/components/teacher/LearningResources.tsx`
- **Problem:** All three components use static arrays without API integration.
- **Impact:** Teachers cannot create real assignments, view dynamic class lists, or upload files from their dedicated portal.

---

### ISSUE-FE-009: Blank Placeholder Transport View in Parent Portal
- **Location:** `frontend/src/components/parent/sections/TransportSection.tsx` (lines 7–15)
- **Problem:** Displays empty placeholder dashes (`—`) for all route, driver, and stop fields.
- **Impact:** Parents see an empty, non-functional transport card.

---

### ISSUE-DB-001: Missing Index on `Attendance.date`
- **Location:** `backend/prisma/schema.prisma` (lines 254–266)
- **Problem:** No index exists on `date` alone. `getAttendance()` performs a full table scan on every date query.
- **Impact:** Performance degradation as attendance records accumulate.

---

### ISSUE-DB-002: N+1 Database Query in `UsersService.getClasses()`
- **Location:** `backend/src/users/users.service.ts` (lines 48–62)
- **Problem:** `getClasses()` fetches distinct class/section pairs and executes a separate `COUNT` query for each inside `Promise.all`.
- **Impact:** High latency and database connection pool exhaustion.

---

### ISSUE-DB-003: Student Accounts Conflated with `parent` Role
- **Location:** `backend/prisma/schema.prisma` (lines 11–36)
- **Problem:** Students are stored with `role = 'parent'`. Every student query filters by `role: 'parent'`.
- **Impact:** Prevents clean separation between parent accounts and student accounts.

---

### ISSUE-DB-004: Missing Foreign Key Relation on `Homework.teacherId`
- **Location:** `backend/prisma/schema.prisma` (lines 280–291)
- **Problem:** `teacherId` is a plain string without a Prisma `@relation` or `onDelete: Cascade`.
- **Impact:** Potential orphaned homework records when a teacher is deleted.

---

### ISSUE-API-001: Inconsistent 401 Unauthorized for Role Type Mismatches
- **Location:** `backend/src/auth/auth.service.ts` (lines 212–214)
- **Problem:** `verifyStudent()` throws `UnauthorizedException` (401) instead of `ForbiddenException` (403).
- **Impact:** Frontend interprets 401 as session expiry and prematurely logs out users.

---

### ISSUE-API-002: Unused `accessToken` Parameters in Data Services
- **Location:** `frontend/src/services/data-service.ts` (lines 12–35)
- **Problem:** Functions accept `accessToken: string` but `apiRequest` reads from storage internally.
- **Impact:** Code bloat and confusing call signatures.

---

### ISSUE-API-003: Missing Global Rate Limiting on Authentication Endpoints
- **Location:** `backend/src/main.ts`, `backend/src/auth/auth.controller.ts`
- **Problem:** No rate limiter (`@nestjs/throttler`) is configured on `POST /auth/login`.
- **Impact:** Vulnerable to automated credential stuffing and brute-force attacks.

---

## 🔵 LOW SEVERITY ISSUES (10 ISSUES)

---

1. **LOW-001 | Personal File in Frontend Directory:** `frontend/Internship Bonofide - Sem 1.docx` (96 KB) is present in the repository root.
2. **LOW-002 | Debug Scripts in Backend Root:** `check-admin.js`, `test-api.js`, `test-hw.js`, `test-new-db.js`, `test-tables.js`, and `verify-connections.js` are in the production backend directory.
3. **LOW-003 | Native `alert()` Used for Form Errors:** `frontend/src/components/dashboard/homework-page.tsx` line 68 uses `alert()`.
4. **LOW-004 | Verbose Console Logging in Production:** `main.ts`, `auth.controller.ts`, and `users.service.ts` log user emails and request URLs to stdout.
5. **LOW-005 | Random Student Email Generation:** `admission-page.tsx` line 84 generates emails with `Math.random()`, risking collisions.
6. **LOW-006 | Static Notification Indicator:** `dashboard-layout-shell.tsx` line 209 always renders an orange unread dot.
7. **LOW-007 | Missing ARIA Labels on Icon Buttons:** Interactive icon buttons lack accessibility labels.
8. **LOW-008 | Unmapped `guardianMobile` Field:** `auth.service.ts` attempts to map `changes.guardianMobile` to `StudentProfile`, which lacks that column.
9. **LOW-009 | Misleading `supabase.ts` Filename & Unused Package:** `frontend/src/lib/supabase.ts` implements backend HTTP uploads. `@supabase/supabase-js` is installed but never imported.
10. **LOW-010 | Orphaned Root Script:** `frontend/modernize-theme.js` exists in the frontend root without documentation or build integration.

---

## ⚪ INFORMATIONAL NOTES (5 ISSUES)

---

1. **INFO-001 | Custom HMAC-SHA256 JWT Implementation:** The manual JWT implementation in `auth.service.ts` works, but migrating to `@nestjs/jwt` + `@nestjs/passport` is recommended for standard maintenance.
2. **INFO-002 | Duplicate Icon Libraries:** Both `@phosphor-icons/react` and `lucide-react` are installed and used across components.
3. **INFO-003 | Large Attendance Payload:** `getAttendance()` loads all student profiles and daily records into memory. Server-side pagination is recommended.
4. **INFO-004 | Missing Self-Service Password Reset:** No "Forgot Password" or email-based recovery flow exists.
5. **INFO-005 | Undefined `superadmin` Role Functionality:** `superadmin` exists in the database enum but has no distinct capabilities from `admin`.

---

# Complete System Module & API Verification Matrix

| Module Name | UI Page / Component | Backend Controller & Service | DB Model | API Integration Status | Security / Auth Status | Health |
|---|---|---|---|---|---|---|
| **Authentication** | `login/page.tsx`, `use-auth.tsx` | `AuthController`, `AuthService` | `User` | ✅ Connected (POST /login, /refresh) | 🔴 FAILED (Plaintext PW, 500 on /me) | 50% |
| **User Directory** | `UsersPage.tsx` | `UsersController`, `UsersService` | `User`, `StudentProfile`, `TeacherProfile` | ✅ Connected (GET /users) | 🔴 FAILED (Passwords in API, RolesGuard bypassed) | 40% |
| **Student Admission** | `admission-page.tsx` | `UsersController`, `UsersService` | `User`, `StudentProfile` | ✅ Connected (POST /users/student) | 🔴 FAILED (Hardcoded "SNSAC@123" PW) | 55% |
| **Staff Management** | `staff-page.tsx` | `UsersController`, `UsersService` | `User`, `TeacherProfile` | ✅ Connected (POST /users/teacher) | 🔴 FAILED (RolesGuard bypassed) | 60% |
| **Attendance (Student)** | `attendance-page.tsx` | `AttendanceController`, `AttendanceService` | `Attendance` | ✅ Connected (GET /attendance, POST /mark) | 🔴 FAILED (Missing AuthGuard, IDOR) | 45% |
| **Attendance (Teacher)** | `attendance-page.tsx` | `AttendanceController`, `AttendanceService` | `Attendance` (`FACULTY`) | ⚠️ Broken Query (Mismatched IDs) | 🔴 FAILED (Returns 0 records) | 25% |
| **Timetable** | `timetable-page.tsx`, `ScheduleManager.tsx` | `TimetableController`, `TimetableService` | `TimetableEntry`, `ClassTimetableConfig` | ⚠️ Endpoint 500 on `/timetable/mine` | 🔴 FAILED (Missing AuthGuard, Unprotected POST/PUT) | 50% |
| **Homework** | `homework-page.tsx`, `DiarySection.tsx` | `HomeworkController`, `HomeworkService` | `Homework` | ⚠️ Endpoint 500 on `POST /homework` | 🔴 FAILED (Missing AuthGuard) | 60% |
| **Exams & Marks** | `results-page.tsx`, `AcademicSection.tsx` | `ExamsController`, `ExamsService` | `ExamResult`, `ExamSchedule` | ✅ Connected (bulk save, schedule) | 🔴 FAILED (Missing AuthGuard, IDOR) | 50% |
| **Notifications & Push** | `notifications-page.tsx` | `NotificationsController`, `FcmService` | `Notification`, `FCMToken` | ✅ Connected (FCM + DB Broadcast) | 🔴 FAILED (Private key on disk) | 65% |
| **Announcements** | `notice-post/page.tsx` | `AnnouncementsController`, `AnnouncementsService` | `Announcement` | ⚠️ Endpoint 500 on `POST /announcements` | 🔴 FAILED (Missing AuthGuard) | 55% |
| **Leave Applications** | `leave-applications-page.tsx` | `LeavesController`, `LeavesService` | `LeaveApplication` | ✅ Connected (submit, list, resolve) | 🟠 High (RolesGuard bypassed) | 80% |
| **Substitutions** | `substitutions-page.tsx` | `SubstitutionsController`, `SubstitutionsService` | `Substitution` | ✅ Connected on `/admin/substitutions` | 🔴 FAILED (Missing AuthGuard) | 60% |
| **Substitutions (Mock)**| `substitution-page.tsx` | None | None | ❌ MOCKED (setTimeout) | 🟡 Duplicate dead route | 0% |
| **School Settings** | `settings-page.tsx` | `SettingsController`, `SettingsService` | `SchoolSettings`, `PromotionHistory` | ⚠️ Connected on General tab only | 🟡 Other tabs simulated | 65% |
| **Role Groups (RBAC)** | `role-management-page.tsx`| `RoleGroupsController`, `RoleGroupsService`| `RoleGroup` | ✅ Connected (CRUD + assign) | 🔴 FAILED (RolesGuard bypassed) | 60% |
| **Group Messaging** | `chat-page.tsx` | `MessagingController`, `MessagingService` | `Group`, `GroupMember`, `Message` | ⚠️ Endpoint 500 on `user.sub` | 🔴 FAILED (Missing AuthGuard) | 40% |
| **Calendar Events** | `calendar-page.tsx` | `CalendarController`, `CalendarService` | `CalendarEvent` | ⚠️ Endpoint 500 on `/my-attendance` | 🔴 FAILED (Missing AuthGuard) | 60% |
| **File Uploads** | `supabase.ts` | `UploadsController` | File system (`./uploads/`) | ✅ Connected (POST /uploads/:folder) | 🔴 FAILED (Unrestricted public upload) | 30% |
| **Reporting Center** | `reports-page.tsx` | `ReportsController`, `ReportsService` | None (stats count only) | ❌ MOCKED (setTimeout, fake filenames) | 🟡 Non-functional export | 20% |
| **Transport Fleet** | `transport-page.tsx` | None | None | ❌ MOCKED (hardcoded static routes) | 🟡 Non-functional | 10% |
| **Parent Academic** | `AcademicSection.tsx` | Multiple Services | Multiple Models | ✅ Connected (Results, Timetable, Leaves) | 🟠 IDOR risk on student queries | 70% |
| **Teacher Overview** | `DashboardOverview.tsx` | `DashboardController`, `UsersService` | Multiple Models | ✅ Connected | 🟠 Missing sub-level auth checks | 75% |
| **Teacher Resources** | `LearningResources.tsx` | None | None | ❌ MOCKED (static files) | 🟡 Non-functional | 10% |
| **Teacher Assignments**| `AssignmentsExams.tsx` | None | None | ❌ MOCKED (static items) | 🟡 Non-functional | 10% |

---

# Verification Checklist & Production Readiness Audit

### Q1: Is the project safe to deploy to production right now?
**NO.** The project has 10 Critical and 13 High-severity vulnerabilities. Deploying it now exposes plaintext user passwords, allows unauthenticated timetable/attendance manipulation, suffers from 500 crashes across core endpoints, and exposes Firebase service account keys.

### Q2: Is authentication secure?
**NO.** Passwords are stored in plaintext. JWT tokens last 1 year. The `/auth/me` endpoint crashes with 500 because `AuthGuard` is missing on `AuthController`.

### Q3: Is authorization (RBAC) functional?
**NO.** `RolesGuard` has an intentional override returning `true` for all requests. Any authenticated user can perform all administrative operations.

### Q4: Are endpoints protected from unauthenticated access?
**NO.** 11 controllers lack `AuthGuard`. Anonymous requests can read teacher data, class timetables, calendar events, and upload files.

### Q5: Why do several authenticated endpoints fail with HTTP 500?
Because `AuthGuard` is missing on controllers, `@CurrentUser()` returns `undefined`. Accessing `user.sub` throws an unhandled `TypeError` in JavaScript.

### Q6: Are there fake or mocked modules?
**YES.**
1. Reports Center (`reports-page.tsx`): 2-second `setTimeout` simulation with fake filenames.
2. Transport Management (`transport-page.tsx` & `TransportSection.tsx`): Hardcoded mock arrays and empty placeholder dashes.
3. Substitution (`substitution-page.tsx`): Simulated submission (duplicate of real `substitutions-page.tsx`).
4. Settings non-general tabs (`settings-page.tsx`): Simulated save via `setTimeout`.
5. Teacher Portal Assignments & Learning Resources: Static dummy arrays with no API connection.

---

# Top 15 Priority Issues for Remediation

```
┌────┬───────────┬─────────────────────────────────────────────────────────────────────────────┐
│ #  │ Issue ID  │ Problem Description                                                         │
├────┼───────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 1  │ SEC-001   │ Re-enable RolesGuard and fix underlying role resolution                     │
│ 2  │ SEC-002   │ Register global AuthGuard in AppModule or attach @UseGuards to all 11 ctrls │
│ 3  │ BKD-001   │ Fix unhandled TypeError (500) on user.sub across unprotected controllers   │
│ 4  │ BKD-002   │ Attach AuthGuard to AuthController to fix 500 on GET /auth/me & profile ops │
│ 5  │ SEC-003   │ Install bcrypt and hash all passwords during creation, update, and auth     │
│ 6  │ SEC-004   │ Remove password field from UsersService.mapUser() and remove UI toggle      │
│ 7  │ SEC-005   │ Rotate Firebase service account key and move to FIREBASE_SERVICE_ACCOUNT    │
│ 8  │ SEC-006   │ Rotate Supabase DB password and remove plaintext credentials from .env      │
│ 9  │ SEC-007   │ Remove hardcoded universal "SNSAC@123" student password                     │
│ 10 │ SEC-008   │ Add AuthGuard, MIME-validation, and size limits to UploadsController        │
│ 11 │ AUTH-001  │ Reduce JWT access token TTL to 8 hours and refresh TTL to 14 days           │
│ 12 │ BKD-003   │ Fix teacher attendance ID query mismatch in AttendanceService               │
│ 13 │ BKD-004   │ Add parent-student ownership checks to prevent IDOR on exam results & marks │
│ 14 │ FE-003    │ Remove duplicate /admin/substitution route and standardize on plural route   │
│ 15 │ DEPL-002  │ Re-enable TypeScript & ESLint checks in next.config.ts                      │
└────┴───────────┴─────────────────────────────────────────────────────────────────────────────┘
```

---

*Report Generated by: Antigravity AI — Full-Stack Audit Agent*  
*Total Audited Modules: 55+ Components, 17 Backend Controllers, 14 Services, 24 Routes*  
*Audit Action: Verification and Documentation Only (Zero Code Modifications Committed)*  
*Report Location: `check and fix/PROJECT_AUDIT_REPORT.md`*
