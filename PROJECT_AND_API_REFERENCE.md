# Student Welfare Fund – Project & API Reference (English)

This document describes the **Student Welfare Fund** project structure and all **backend APIs** used by the Flutter app, so you can build a **separate web project** (e.g. React, Vue, Next.js) that talks to the same backend.

---

## 1. Project Overview

- **App type:** Flutter (mobile + web) – Student Welfare Fund (donations, campaigns, student registration).
- **Backend:** Laravel API (base URL configurable; default in app: `http://192.168.100.66:8000`; production: e.g. `https://welfare-student.maksab.om`).
- **API prefix:** All main APIs are under `{BASE_URL}/api/v1`, except auth which uses `{BASE_URL}/api`.
- **Authentication:** Bearer token stored after login/register; sent as `Authorization: Bearer <token>`.
- **Payment:** Thawani payment gateway; backend creates payment sessions and returns checkout URLs.

---

## 2. Base URLs (from app config)

| Purpose              | Value                          |
|----------------------|---------------------------------|
| Server base          | `APP_URL` (e.g. `https://welfare-student.maksab.om`) |
| API v1 base          | `{APP_URL}/api/v1`             |
| Auth base            | `{APP_URL}/api`                |
| Donations + payment  | `{API_V1}/donations/with-payment` |
| Payment confirm      | `{API_V1}/payments/confirm`    |
| Success / Cancel     | `{API_V1}/payments/success`, `{API_V1}/payments/cancel` |

For a separate web app, use the same `APP_URL` (or your backend URL) and the same paths below.

---

## 3. Authentication APIs

Base for auth: **`{APP_URL}/api`** (no `/v1` in path for auth routes).

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST   | `/auth/register` | No | Legacy register: `phone`, `password`, `password_confirmation`, `name`, optional `email`. Returns token in `data.token` or `token`. |
| POST   | `/auth/register/phone` | No | Register with phone + OTP: same body. Returns e.g. `verifyId`, `phone` (masked). No token until OTP verified. |
| POST   | `/auth/verify/phone/otp` | No | Verify OTP: `verifyId`, `verifyCode`. Returns token in `data.token` or `token`. |
| GET    | `/auth/dev/otp` | No | Dev only: `?verifyId=...` – returns OTP for testing. |
| POST   | `/auth/resend-otp` | No | Body: `{ "phone": "968..." }`. Returns new `verifyId`, etc. |
| POST   | `/auth/login` | No | Body: `phone`, `password`. Returns token in `data.token` or `token`. |
| POST   | `/auth/logout` | Yes | Logout; clear token on client. |
| GET    | `/v1/me/edit/profile` | Yes | Current user profile (AuthService uses auth base so full path is `{APP_URL}/api/v1/me/edit/profile`). |
| PATCH  | `/v1/me/edit/profile` | Yes | Update profile: `name`, `phone`, optional `email`. |

**Note:** In the app, “profile” is called with base `{APP_URL}/api`, so the full URLs are `{APP_URL}/api/v1/me/edit/profile` for GET/PATCH.

---

## 4. Campaigns & Programs (Categories, Donations, Quick amounts)

Base: **`{APP_URL}/api/v1`**. Use **Bearer token** when user is logged in (optional for some list endpoints).

### 4.1 Student support programs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/programs` | Optional | List student support programs. Tried also: `/programs/support`, `/student-programs`. |
| GET | `/programs/{id}` | Optional | Single program details. |

**Response:** Array or `data` array of objects with: `id`, `title` / `title_ar` / `title_en`, `description` / `description_ar` / `description_en`, `image_url` (or `image`, `photo`, `photo_url`, `banner`, `banner_url`), `goal_amount`, `raised_amount`, `created_at`, `end_date`, `status` / `is_active`, `category` (object with `name`, `name_ar`, `name_en`), `donor_count` / `donors_count`.

### 4.2 Charity campaigns

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/campaigns` | Optional | List campaigns. Query: `page`, `limit` / `per_page`. |
| GET | `/campaigns/urgent` | Optional | Urgent campaigns. |
| GET | `/campaigns/featured` | Optional | Featured campaigns. |
| GET | `/campaigns/{id}` | Optional | Single campaign. |

**Response:** Same shape as programs; may include `impact_description`, `impact_description_ar` / `_en`, `is_urgent`, `is_featured`.

### 4.3 Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories` | Optional | List categories. |

**Response:** Array or `data` with: `id`, `name`, `name_ar`, `name_en`, `description`, `status`.

### 4.4 Donations (create, recent, user list)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/donations` | Yes | Create donation (no payment): `item_id`, `item_type` (`program` \| `campaign`), `amount`, optional `donor_name`, `donor_phone`, `donor_email`, `message`. |
| GET | `/donations/recent` | Optional | Recent donations. Query: `limit` (e.g. 5). |
| GET | `/donations` or `/me/donations` | Yes | User’s donations (app tries several endpoints). Query: `page`, `limit` for pagination. |
| GET | `/donations/{id}` | Yes | Single donation details. |

### 4.5 Quick donation amounts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/donations/quick-amounts` | No | List of suggested amounts (numbers). Fallback in app: [10, 25, 50, 100, 200, 500]. |

---

## 5. Donations with payment (Thawani flow)

These create a donation and a Thawani payment session in one or two steps; the backend returns a checkout URL and session id.

### 5.1 Create donation with payment (logged-in or anonymous)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/donations/with-payment` | Optional | Create donation + payment session. |

**Request body:**

- `program_id` or `campaign_id` (int, one required for program/campaign donation).
- `amount` (number, OMR).
- `is_anonymous` (boolean).
- Optional: `donor_name`, `donor_email`, `donor_phone`, `note`, `message`.
- Optional: `return_origin` (e.g. web app origin for redirect after payment).

**Response (success):**

- `data.payment_session.payment_url` or `payment_url` / `checkout_url` / `redirect_url` (Thawani checkout URL).
- `data.payment_session.session_id` or `session_id`.
- `data.donation.donation_id` or `donation_id` / `id`.

If donation is created but payment session fails, response may include `payment_error` and `donation_id`; show message and optionally allow retry.

### 5.2 Anonymous donation with payment

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/donations/anonymous-with-payment` | No | Same as above for anonymous users; backend may require `donor_phone` or similar. |

Use same request/response shape as above where applicable.

---

## 6. Payment APIs

Base: **`{APP_URL}/api/v1`**. Bearer token optional (for logged-in users).

### 6.1 Create payment session (standalone)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/create` | Optional | Create Thawani session without creating donation first. |

**Request body (matches Laravel):**

- `products`: array of `{ name, quantity, unit_amount }` (unit_amount in **baisa**; 1 OMR = 1000 baisa).
- Optional: `client_reference_id` (Thawani allows only English letters, digits, spaces, Arabic – no `-` or `_`).
- Optional: `program_id`, `campaign_id`, `donor_name`, `note`, `return_origin`, `type` (`quick` \| `gift`).

**Response:** Payment session object with `payment_url` and `session_id` (or equivalent).

### 6.2 Create payment for existing donation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/create-with-donation` | Optional | Create payment session for an existing donation. Body: `donation_id`, `amount_omr`, optional `return_origin`. |

### 6.3 Check payment status

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/payments/status/{sessionId}` | Optional | Get status of payment session (e.g. paid, pending, failed). |

### 6.4 Confirm payment (after user returns from Thawani)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/confirm` | Optional | Confirm payment after success. Body typically includes session id or payment reference; backend marks donation as paid. |

Used after redirect from Thawani when `result.status == 'success'`.

### 6.5 Other payment endpoints (used by app)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/payments/mobile/success` | Optional | Mobile success callback. |
| GET | `/payments?session_id={sessionId}` | Optional | Get payment by session id. |

Redirect URLs for Thawani (configured on backend): `{API_V1}/payments/success`, `{API_V1}/payments/cancel`.

---

## 7. Fund partners (public)

Base: **`{APP_URL}/api/v1`**. No auth.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fund-partners` | List active partners. Query: `featured=1`, `limit=20`. |
| GET | `/fund-partners/featured` | Featured partners only. |
| GET | `/fund-partners/{id}` | Single partner. |

**Response:** Objects with `id`, `name_ar`, `name_en`, `description_ar`, `description_en`, `logo` / `logo_url`, `link`, `status`, `order`, `is_featured`. Resolve logo URL: if not absolute, prepend `{APP_URL}` (e.g. `{APP_URL}/storage/...`).

---

## 8. Fund news (public)

Base: **`{APP_URL}/api/v1`**. No auth.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fund-news` | List active news. |
| GET | `/fund-news/featured` | Featured news. |
| GET | `/fund-news/{id}` | Single news. |

**Response:** `id`, `title_ar`, `title_en`, `content_ar`, `content_en`, `image` / `image_url`, `status`, `order`, `is_featured`, `published_at`. Image URL: prepend server base if relative.

---

## 9. Banners

Base: **`{APP_URL}/api/v1`**. No auth.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/banners` | Active banners. |
| GET | `/banners/featured` | Featured banners. |
| GET | `/banners/{id}` | Single banner. |

**Response:** Objects with `id`, `title`, `title_ar`, `title_en`, `subtitle`, `description`, `image_url`, `mobile_image_url`, `action_url`, `action_label`, `is_featured`, `is_active`, `priority`, `starts_at`, `ends_at`, `placements`, etc. App filters by `shouldDisplayOnHome` (active + within schedule).

---

## 10. Student registration

Base: **`{APP_URL}/api/v1`**. Auth required for “my registration” and submit.

### 10.1 Submit / update registration

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/students/registration` | Yes | Submit new registration (multipart/form-data). |
| PUT | `/students/registration/{id}` | Yes | Update registration (e.g. after rejection). |
| POST | `/students/registration/{id}/documents` | Yes | Upload documents for a registration. |

**Submit body (form-data):**

- `program_id` (int).
- Personal: `personal[full_name]`, `personal[civil_id]`, `personal[date_of_birth]` (YYYY-MM-DD), `personal[phone]`, `personal[address]`, `personal[marital_status]`, optional `personal[email]`.
- Academic: `academic[institution]`, `academic[student_id]`, optional `academic[college]`, `academic[major]`, `academic[program]`, `academic[academic_year]`, `academic[gpa]`.
- Guardian: `guardian[name]`, `guardian[job]`, `guardian[monthly_income]`, `guardian[family_size]`, `guardian[is_father_alive]` (1/0), `guardian[is_mother_alive]` (1/0), `guardian[parents_marital_status]` (e.g. stable, separated).
- Files: `documents[documentKey]` (multiple files).

### 10.2 Get registrations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/students/registration` | Yes (admin) | List registrations. Query: `page`, `limit`, `status`, `search`. |
| GET | `/students/registration/my-registration` | Yes | Current user’s registration (single). Returns 404 if none. |
| GET | `/students/registration/{id}` | Yes | One registration by id. |

**Status values:** `under_review`, `accepted`, `rejected`, `completed`. Backend may return Arabic labels; app normalizes to these. Optional `rejection_reason`.

### 10.3 Delete

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| DELETE | `/students/registration/{id}` | Yes | Delete a registration. |

---

## 11. Settings / static pages

Base: **`{APP_URL}/api/v1`** (ApiClient). Auth optional.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings-pages/{key}` | Get static page content by key (e.g. about, terms). |

**Response:** Page object with content fields (e.g. `key`, `title`, `content_ar`, `content_en`); exact shape depends on backend.

---

## 12. FCM (push notifications)

Base: **`{APP_URL}/api/v1`**. Auth required.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/fcm-token` | Register device for push. Body: `device_id`, `fcm_token`, `platform`. |

---

## 13. Student registration card (optional)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/student-registration-card` | Yes | App fetches a “registration card” (content/config). |

---

## 14. Thawani – client_reference_id rule

Backend must send Thawani a `client_reference_id` that contains **only**:

- English letters, digits, spaces, Arabic characters.

No hyphens (`-`) or underscores (`_`). If you use donation id (e.g. `DN_xxx-xxx`), sanitize before sending to Thawani (e.g. strip `-` and `_`, or use something like `donation{id}`). See `docs/THAWANI_CLIENT_REFERENCE_ID.md` in the repo.

---

## 15. Flutter project structure (reference)

- **`lib/constants/app_config.dart`** – Base URLs, payment endpoints.
- **`lib/services/api_client.dart`** – Dio client, base `{APP_URL}/api/v1`, Bearer token from storage, 401 clears token.
- **`lib/services/auth_service.dart`** – Auth API calls (base `{APP_URL}/api` for auth routes).
- **`lib/services/campaign_service.dart`** – Programs, campaigns, categories, quick amounts, create donation (no payment).
- **`lib/services/donation_service.dart`** – Donations with payment, anonymous with payment, confirm, recent, user donations.
- **`lib/services/payment_service.dart`** – Create session, create-with-donation, status, confirm, client_reference_id generator.
- **`lib/services/student_registration_service.dart`** – All student registration endpoints.
- **`lib/services/fund_partner_service.dart`** – Fund partners.
- **`lib/services/fund_news_service.dart`** – Fund news.
- **`lib/services/banner_service.dart`** – Banners.
- **`lib/providers/setting_page_provider.dart`** – Settings pages.

Models: `lib/models/campaign.dart`, `donation.dart`, `fund_partner.dart`, `fund_news.dart`, `app_banner.dart`, `payment_request.dart`, `payment_response.dart`, `payment_status_response.dart`, `student_registration.dart`, etc.

---

## 16. Suggested web project usage

1. **Environment:** Set `VITE_API_URL` or `NEXT_PUBLIC_API_URL` (or equivalent) to your backend base (e.g. `https://welfare-student.maksab.om`).
2. **API base:** `${API_URL}/api/v1` for most routes; `${API_URL}/api` for auth routes (then path like `/auth/login`, `/v1/me/edit/profile`).
3. **Auth:** Store token (e.g. localStorage/cookie); send `Authorization: Bearer <token>`; on 401 clear token and redirect to login.
4. **Donations:** Use `POST /donations/with-payment` (or anonymous endpoint) with `return_origin` = your web origin; redirect user to returned `payment_url`; after redirect, call `POST /payments/confirm` if backend expects it.
5. **Payments:** Amounts in OMR; convert to baisa (× 1000) only when backend expects baisa (e.g. in `products[].unit_amount`).
6. **Images:** If API returns relative paths (e.g. `/storage/...`), resolve with `${API_URL}${path}` or backend’s `APP_URL`.

This document and the listed endpoints are sufficient to implement a separate web front-end that reuses the same backend and APIs.

---

## Public slugs and shareable donate URLs

Every campaign and program has a `slug`: a random, unique, immutable 5-letter identifier (e.g. `xkqmd`), returned by the catalog endpoints. It is never derived from the title, so renaming an item never breaks a shared link.

- **Lookup by id or slug:** `GET /api/v1/campaigns/{id|slug}` and `GET /api/v1/programs/{id|slug}`. Numeric values are treated as ids, so existing clients (including the Flutter app) keep working. Payment and donation requests still use the numeric `campaign_id` / `program_id`.
- **Web donate URLs:** `/c/{slug}` for campaigns and `/p/{slug}` for programs (short, top-level paths). The old `/donate?campaign_id=1` and `/donate?program_id=3` redirect to them.
- **Optional query params on the donate URL:** `amount` (prefills the amount), `lang` (`ar` or `en`), `ref` (source tag, ignored by the app and stripped from the copy/share links).
- **Link previews:** social crawlers do not run JavaScript, so the backend serves Open Graph pages at `GET /share/campaign/{slug}` and `GET /share/program/{slug}` (`?lang=en` for English). Humans opening them are redirected to the web app (`FRONTEND_ORIGIN`).
- **Production routing:** configure the web server/CDN to proxy crawler user-agents (WhatsApp, facebookexternalhit, Twitterbot, Telegram, etc.) requesting `/c/{slug}` and `/p/{slug}` to `/share/campaign/{slug}` and `/share/program/{slug}` on the backend. Everyone else gets the SPA.
- **Sitemap:** `GET /sitemap.xml` lists the active donate URLs. Point the web app's `public/robots.txt` `Sitemap:` line at the production API origin.
- `/donate/return` and `/payments/success` (payment return pages) are unchanged.
