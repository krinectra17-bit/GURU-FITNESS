# GURU FITNESS & NUTRITIONS
### Premium Fitness Website + Complete Gym Management System

![Guru Fitness Brand](public/favicon.svg)

> **Brand Positioning:** Transforming Bodies, Transforming Lives.  
> **Brand Promise:** Expert Training. Scientific Nutrition. Real Results. Lifetime Support.  
> **Core Values:** Dedication. Discipline. Consistency.  
> **Founders & Coaches:**  
> - **Rakesh Bagra:** Founder & Head Coach, Certified Personal Trainer, **NPC Mr. Rajasthan 2022 Winner** (Senior Category). 10+ Years Experience, 1,000+ Transformed Clients.  
> - **Chitra Bagra:** Yoga & Fitness Coach, Certified Yoga Trainer, Women's Fitness Specialist.  
> **Official Contact:** +91 9828482505 (Primary) • +91 7014838282 • Instagram: [@rakesh_bagra_fit](https://instagram.com/rakesh_bagra_fit)  

---

## 🏋️‍♂️ System Overview

**GURU FITNESS & NUTRITIONS** is a production-oriented, full-stack web application combining a human-designed athletic website with an enterprise-grade gym management, fee collection, attendance, and member retention platform.

### Architectural Highlights
1. **Public Brand Experience**: Custom editorial design (Deep Charcoal `#0B0D11`, Warm White `#F9FAFB`, Athletic Red `#D90429`). High-contrast typography paired with Google Fonts (*Barlow Condensed* and *Inter*).
2. **Member Registration & Security**: Online member onboarding with client and server validation. Automatically assigns `PENDING ACTIVATION` status; members access their personalized portal while gym floor access and payment are confirmed by administration.
3. **Personalized Member Dashboard**: Individual member access to membership contracts, fee dues, interactive calendar attendance, QR pass generation, payment histories, and printable official receipts.
4. **Comprehensive Admin Management (`/admin`)**:
   - Executive dashboard with live database queries (Registered, Active, Pending, Expired, Dues, Collections, Today's check-ins).
   - Member Directory with approval, activation, suspension, and editing.
   - Membership Plans Catalog with future price editing while preserving historical contracted prices.
   - Ledger & Payments with support for UPI, Cash, Bank Transfer, and Online settlements with printable invoices.
   - QR Attendance Hub with live manual entry and a Front Desk Dynamic QR Kiosk.
   - WhatsApp Reminders (Manual 1-click pre-filled chats + Automated Meta WhatsApp Cloud API runner).
   - Responsible Nutrition Programs with health disclaimers.
   - Financial Reports with CSV export.
   - Gym Settings (editable address, phone numbers, Google Maps link, cutoff hours).
   - Immutable Audit Logs.

---

## 💰 Official Pricing Schedule
Effective from **1 August 2026** as specified on the gym's official promotional poster:

| Program Category | Monthly (1 Mo) | Quarterly (3 Mos) | Half-Yearly (6 Mos) | Yearly (12 Mos) |
| :--- | :--- | :--- | :--- | :--- |
| **Strength Training** | ₹800 | ₹2,000 | ₹3,500 | ₹5,000 |
| **Cardio / Fat Loss / Yoga** | ₹1,200 | ₹3,000 | ₹5,000 | ₹8,000 |
| **Personal Training (1-on-1)** | ₹4,000 | ₹9,000 | ₹15,000 | ₹21,000 |

* **Group Discount:** **15% discount** for a minimum of 3 people joining together. Dynamically calculated and validated.

---

## 🚀 Instant Local Testing (Zero Setup Required)

The application includes an in-browser high-fidelity database engine. When Supabase environment variables are not supplied, it automatically runs in offline demo mode with test personas accessible via the top test bar:

1. **Rakesh Bagra (Admin / Owner)**: `admin@gurufitness.com`
2. **Rahul Sharma (Active Member)**: `rahul.sharma@example.com` (Yearly Strength, Fully Paid)
3. **Priya Verma (Balance Due Member)**: `priya.verma@example.com` (Cardio / Yoga, ₹1,000 Pending)
4. **Amit Choudhary (Pending Activation)**: `amit.choudhary@example.com` (New Registration)
5. **Sunita Meena (Expired Member)**: `sunita.meena@example.com` (Strength Monthly, Expired)

### Running Locally
```bash
# 1. Clone repository and navigate
cd "Guru Fitness"

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```

---

## 🗄️ Supabase PostgreSQL Setup & RLS Migration

### 1. Execute Database Migration
Log in to your [Supabase Dashboard](https://supabase.com), open the **SQL Editor**, and execute:
```sql
supabase/migrations/20260801000000_initial_schema.sql
```
This script provisions:
- `profiles`, `user_roles`, `membership_plans`, `memberships`, `payments`, `attendance`, `notifications`, `reminder_logs`, `gym_settings`, `audit_logs`.
- Foreign key constraints, unique constraints, and high-performance b-tree indexes.
- Strict **Row Level Security (RLS)** ensuring members can only view their own records while administrators possess full management rights.
- Helper security function `is_admin(user_id)` to prevent client-side privilege escalation.

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Create the Initial Admin User
1. Register or invite `admin@gurufitness.com` under **Authentication -> Users** in Supabase.
2. In the SQL Editor, grant the admin role:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<user-id-from-auth.users>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## 📲 WhatsApp Business Platform Integration

### 1. Manual Click-To-Chat (Enabled Out of the Box)
From `/admin/whatsapp`, the gym administrator can select any member, choose from compliant templates (3 days before expiry, 1 day before expiry, expiry day, post-expiry, or fee balance due), and click **Open WhatsApp Web / App**. This opens `wa.me` with a pre-filled message and registers a permanent entry in `reminder_logs`.

### 2. Automated Meta WhatsApp Cloud API Setup
To enable server-driven background reminders:
1. Create a Meta Business app at [developers.facebook.com](https://developers.facebook.com).
2. Add the **WhatsApp** product.
3. Retrieve your **Phone Number ID** and **WhatsApp Business Account ID (WABA)**.
4. Input these credentials into `/admin/settings` or your `.env` file (`VITE_WHATSAPP_PHONE_NUMBER_ID`, `VITE_WHATSAPP_BUSINESS_ACCOUNT_ID`, `VITE_WHATSAPP_ACCESS_TOKEN`).
5. Ensure message templates matching the prompt's copy are approved in Meta WhatsApp Manager.

---

## 🚢 Deployment (Vercel)

1. Push this repository to GitHub or GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Set Build Command: `npm run build` and Output Directory: `dist`.
4. Add Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
5. `vercel.json` is included to handle client-side Single Page Application (SPA) routing for all paths (`/training`, `/memberships`, `/dashboard`, `/admin`).

---

## 🛡️ Security & Quality Standards
- **Client Privilege Isolation**: Role determinations are enforced at the database layer through Row Level Security (RLS); browser requests cannot elevate user roles.
- **Payment Verification Gate**: Members selecting a plan remain `Pending Activation` until an authorized administrator records verified payment.
- **Dynamic QR Tokens**: QR check-ins use short-lived timestamped payloads and verify anti-duplicate checks for the calendar day.
- **Responsible Medical Notice**: Nutrition guidance is presented as sports wellness advice with an explicit medical disclaimer recommending consultation with licensed healthcare professionals.
