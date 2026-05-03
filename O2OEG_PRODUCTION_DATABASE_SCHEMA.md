# 🟣 O2OEG PRODUCTION DATABASE SCHEMA
## Multi-Tenant SaaS Architecture

---

# 🧱 CORE ARCHITECTURE RULE

All tables MUST include:
tenant_id (UUID FK)

---

# 🏢 TENANCY CORE

```sql
CREATE TABLE tenants (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255),
  domain VARCHAR(255),
  status ENUM('active','inactive'),
  created_at TIMESTAMP
);
```

---

# 👤 USERS

```sql
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36),
  name VARCHAR(255),
  email VARCHAR(255),
  password VARCHAR(255),
  role ENUM('admin','owner','staff'),
  created_at TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

---

# ⚙️ SERVICES ENGINE

```sql
CREATE TABLE services (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36),
  name VARCHAR(255),
  description TEXT,
  status ENUM('active','beta','disabled'),
  target_audience ENUM('salon','company','affiliate'),
  pricing_type ENUM('subscription','addon','free'),
  price DECIMAL(10,2),
  created_at TIMESTAMP
);
```

---

# 🧩 SERVICE FEATURES

```sql
CREATE TABLE service_features (
  id CHAR(36) PRIMARY KEY,
  service_id CHAR(36),
  name VARCHAR(255),
  feature_key VARCHAR(255),
  enabled BOOLEAN DEFAULT true,
  FOREIGN KEY (service_id) REFERENCES services(id)
);
```

---

# 📩 LEADS SYSTEM (PRE-LAUNCH)

```sql
CREATE TABLE leads (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  interest_type ENUM('salon','company','affiliate'),
  message TEXT,
  created_at TIMESTAMP
);
```

---

# 💳 SUBSCRIPTIONS (PREP FOUNDATION)

```sql
CREATE TABLE subscriptions (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36),
  plan_name VARCHAR(255),
  status ENUM('active','paused','cancelled'),
  price DECIMAL(10,2),
  started_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

---

# 🔐 SECURITY RULES

- UUID everywhere
- Foreign key enforcement
- Index tenant_id on all tables
- No cross-tenant queries allowed

---

# 🚀 PERFORMANCE RULES

- Use indexes on:
  - tenant_id
  - service_id
  - email

- Enable caching layer (Redis ready)

---

# 🟢 END OF SCHEMA
