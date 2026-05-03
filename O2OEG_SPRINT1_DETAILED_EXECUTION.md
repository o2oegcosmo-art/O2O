# 🟥 O2OEG SPRINT 1 — DETAILED EXECUTION ORDER
## SAAS FOUNDATION + SERVICE ENGINE + PRE-LAUNCH

---

# 🎯 الهدف
تحويل المشروع إلى SaaS Core قابل للتوسع + نظام خدمات ديناميكي + صفحة جذب عملاء

---

# 🧱 PHASE 1 — MULTI TENANT CORE (CRITICAL)

## 📌 المطلوب تنفيذ

### 1. إنشاء قاعدة البيانات Multi-Tenant

#### Tables:

```sql
tenants
- id (UUID PK)
- name
- domain
- status
- created_at

users
- id (UUID PK)
- tenant_id (FK)
- name
- email
- password
- role (admin / staff / owner)
- created_at
```

---

## 🧠 RULES

- كل جدول يجب أن يحتوي `tenant_id`
- منع أي query بدون tenant filter
- استخدام Middleware:

TenantResolverMiddleware

---

# 🧩 PHASE 2 — SERVICE ENGINE (CORE BUSINESS LAYER)

## 🎯 الهدف
تحويل النظام إلى “Marketplace SaaS Services”

---

## 📦 Tables

```sql
services
- id (UUID)
- tenant_id
- name
- description
- status (active / beta / disabled)
- target_audience (salon/company/affiliate)
- pricing_type (subscription/addon/free)
- price
- created_at

service_features
- id
- service_id
- name
- key
- enabled (boolean)
```

---

## ⚙️ LOGIC RULES

- Service can be created without coding
- Each service = independent module
- Admin can enable/disable services instantly

---

## 🧠 SERVICE ENGINE API

### Endpoints:

POST /api/services/create
GET /api/services
PATCH /api/services/{id}
DELETE /api/services/{id}

---

# 🚀 PHASE 3 — PRE-LAUNCH MARKETING SYSTEM

## 🎯 الهدف
جمع العملاء قبل تشغيل النظام

---

## 📦 Table

```sql
leads
- id (UUID)
- name
- email
- phone
- interest_type (salon/company/affiliate)
- message
- created_at
```

---

## 🌐 FRONTEND PAGE

### Landing Page must include:

- Hero Section:
  "منصة O2OEG قادمة قريبًا"

- Description:
  AI Beauty SaaS Ecosystem

- Features Preview:
  - AI Reception
  - Smart Booking
  - Affiliate System

---

## 🎯 CTA BUTTONS

- سجل اهتمامك
- انضم كصالون
- انضم كشركة
- انضم كمسوق

---

# 🧠 SYSTEM RULES

## 🚫 ممنوع:
- استخدام بيانات وهمية دائمة
- ربط الخدمات بدون tenant isolation
- تجاوز Service Engine

## ✅ مطلوب:
- كل شيء ديناميكي
- كل شيء قابل للبيع
- كل شيء قابل للتفعيل والإيقاف

---

# 📦 OUTPUT EXPECTED

✔ Running Laravel API
✔ Service Engine working
✔ Leads captured
✔ Landing Page active
✔ Multi-Tenant enforced

---

# 🟢 END OF SPRINT 1
