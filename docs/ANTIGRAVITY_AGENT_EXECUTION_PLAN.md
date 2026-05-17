# 🚀 ANTIGRAVITY AI — AGENT EXECUTION PLAN
## O2OEG Beauty SaaS Platform · Pre-Production to Live Launch

**Version:** 1.1  
**Date:** 2026-04-27  
**Authority:** Board-Level Directive  
**Classification:** INTERNAL · EXECUTE IMMEDIATELY  
**Current Completion:** 96% → Target: 100% Production-Ready

---

> **⚠️ AGENT DIRECTIVE (UPDATE 2026-04-27)**  
> تم تغيير تكتيك الربط مع واتساب من Meta Cloud API (بسبب الحظر) إلى **Unofficial WhatsApp Bridge** باستخدام مكتبة Baileys.  
> نجحنا في تشغيل الـ AI والقيام بأول حجز حقيقي عبر هذا الجسر.

---

## 📋 جدول المحتويات

1. [نظرة عامة على الخطة](#1-نظرة-عامة-على-الخطة)
2. [المرحلة الأولى — إغلاق المخاطر الحرجة (مكتملة ✅)](#2-المرحلة-الأولى--إغلاق-المخاطر-الحرجة)
3. [المرحلة الثانية — استقرار النظام (يوم 4–6)](#3-المرحلة-الثانية--استقرار-النظام)
4. [المرحلة الثالثة — Soft Launch (يوم 7–10)](#4-المرحلة-الثالثة--soft-launch)
5. [المهام التقنية التفصيلية](#5-المهام-التقنية-التفصيلية)
6. [معايير القبول الإجمالية](#6-معايير-القبول-الإجمالية)

---

## 1. نظرة عامة على الخطة

### الجدول الزمني (المحدث)

```
اليوم 1-3  │  ✅ DONE          │ ربط MySQL، تفعيل Gemini، وتشغيل WhatsApp Bridge
اليوم 4-6  │  🟡 STABILIZE      │ تأمين Webhook الجسر واختبار الحجوزات المتعددة
اليوم 7    │  🟢 GO / NO-GO     │ قرار الإطلاق الرسمي
| الرمز | المعنى |
|-------|--------|
| 🔴 P0 | حرج — يمنع الإطلاق تماماً، يُنفَّذ فوراً |
| 🟡 P1 | عالي — يجب إنجازه قبل Soft Launch |
| 🟢 P2 | متوسط — يُنجز قبل Full Launch |
| ⚪ P3 | منخفض — يُجدوَل في Sprint التالي |

---

## 2. المرحلة الأولى — إغلاق المخاطر الحرجة (يوم 1–3)

### 🔴 TASK-001 · نقل قاعدة البيانات من SQLite إلى MySQL

**الأولوية:** P0 · **المسؤول:** Backend Lead  
**الوقت المقدر:** 6-8 ساعات  
**السبب:** SQLite لا تدعم concurrent writes — ستتعطل عند دخول أكثر من مستخدم واحد.

#### الخطوات التنفيذية:

**الخطوة 1 — إعداد MySQL Server**
```bash
# على السيرفر (Ubuntu/Debian)
sudo apt update && sudo apt install -y mysql-server
sudo mysql_secure_installation

# إنشاء قاعدة البيانات والمستخدم
sudo mysql -u root -p
```
```sql
CREATE DATABASE o2oeg_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'o2oeg_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON o2oeg_production.* TO 'o2oeg_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**الخطوة 2 — تحديث ملف `.env`**
```dotenv
# استبدل هذه القيم
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=o2oeg_production
DB_USERNAME=o2oeg_user
DB_PASSWORD=STRONG_PASSWORD_HERE

# تأكد من حذف أو تعطيل هذه السطور
# DB_CONNECTION=sqlite
# DB_DATABASE=/absolute/path/to/database.sqlite
```

**الخطوة 3 — تشغيل Migrations**
```bash
cd /var/www/o2oeg-api

# تنظيف الـ Cache أولاً
php artisan config:clear
php artisan cache:clear

# تشغيل Migrations على قاعدة البيانات الجديدة
php artisan migrate --force

# التحقق من نجاح جميع الـ 42 Migration
php artisan migrate:status
```

**الخطوة 4 — إعداد MySQL للأداء الأمثل**

أضف هذه الإعدادات في `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
innodb_buffer_pool_size = 256M
max_connections = 200
query_cache_size = 64M
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```
```bash
sudo systemctl restart mysql
```

**الخطوة 5 — نقل البيانات (إن وُجدت بيانات تجريبية)**
```bash
# تصدير من SQLite
php artisan db:seed --class=TestDataSeeder  # إذا كانت بيانات seed فقط

# OR إذا كان هناك بيانات حقيقية تحتاج نقل:
# استخدم أداة: https://github.com/techouse/sqlite3-to-mysql
pip3 install sqlite3-to-mysql
sqlite3mysql \
  --sqlite-file database/database.sqlite \
  --mysql-user o2oeg_user \
  --mysql-password STRONG_PASSWORD_HERE \
  --mysql-database o2oeg_production \
  --without-foreign-keys
```

#### ✅ Acceptance Criteria — TASK-001:
- [ ] `php artisan migrate:status` يظهر جميع الـ 42 Migration بحالة `Ran`
- [ ] لا توجد أخطاء في `storage/logs/laravel.log` عند تشغيل أي API endpoint
- [ ] اختبار concurrent requests: أرسل 10 طلبات حجز في نفس الوقت ولا يوجد database lock error
- [ ] `DB_CONNECTION=mysql` مؤكدة في `.env` على السيرفر

---

### 🔴 TASK-002 · Rate Limiting على Webhook الواتساب

**الأولوية:** P0 · **المسؤول:** Backend Lead  
**الوقت المقدر:** 3-4 ساعات  
**السبب:** بدون Rate Limiting، أي bot يمكنه إغراق الـ AI بتكلفة مفتوحة + هجمات DDoS محتملة.

#### الخطوات التنفيذية:

**الخطوة 1 — إضافة Rate Limiter مخصص في `RouteServiceProvider.php`**

```php
// app/Providers/RouteServiceProvider.php

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

protected function configureRateLimiting(): void
{
    // Rate limiter للـ Webhook العام
    RateLimiter::for('webhook', function (Request $request) {
        return Limit::perMinute(60)->by($request->ip());
    });

    // Rate limiter مشدد للـ AI endpoints
    RateLimiter::for('ai_webhook', function (Request $request) {
        $tenantId = $request->input('entry.0.changes.0.value.metadata.phone_number_id', 'unknown');
        return [
            Limit::perMinute(30)->by('ip:' . $request->ip()),
            Limit::perHour(500)->by('tenant:' . $tenantId),
        ];
    });

    // Rate limiter للـ API العام
    RateLimiter::for('api', function (Request $request) {
        return $request->user()
            ? Limit::perMinute(120)->by($request->user()->id)
            : Limit::perMinute(30)->by($request->ip());
    });
}
```

**الخطوة 2 — تطبيق Rate Limiter على مسارات الـ Webhook في `routes/api.php`**

```php
// routes/api.php

// مسارات الـ Webhook مع Rate Limiting مشدد
Route::middleware(['throttle:webhook'])->group(function () {
    Route::get('/webhook/whatsapp', [AIController::class, 'verifyWebhook']);
});

Route::middleware(['throttle:ai_webhook'])->group(function () {
    Route::post('/webhook/whatsapp', [AIController::class, 'handleWebhook']);
});
```

**الخطوة 3 — إضافة Webhook Signature Verification**

```php
// app/Http/Middleware/VerifyWhatsAppWebhook.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifyWhatsAppWebhook
{
    public function handle(Request $request, Closure $next): mixed
    {
        $signature = $request->header('X-Hub-Signature-256');
        
        if (!$signature) {
            return response()->json(['error' => 'Missing signature'], 401);
        }

        $appSecret = config('services.whatsapp.app_secret');
        $payload   = $request->getContent();
        $expected  = 'sha256=' . hash_hmac('sha256', $payload, $appSecret);

        if (!hash_equals($expected, $signature)) {
            \Log::warning('WhatsApp Webhook signature mismatch', [
                'ip' => $request->ip(),
                'received' => $signature,
            ]);
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        return $next($request);
    }
}
```

```php
// app/Http/Kernel.php — أضف في $routeMiddleware
'verify.whatsapp' => \App\Http\Middleware\VerifyWhatsAppWebhook::class,
```

```php
// routes/api.php — طبّق على مسار الـ POST
Route::middleware(['throttle:ai_webhook', 'verify.whatsapp'])->group(function () {
    Route::post('/webhook/whatsapp', [AIController::class, 'handleWebhook']);
});
```

**الخطوة 4 — إضافة APP_SECRET في `.env`**
```dotenv
WHATSAPP_APP_SECRET=your_meta_app_secret_here
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_here
```

#### ✅ Acceptance Criteria — TASK-002:
- [ ] إرسال 35 طلب في دقيقة واحدة → الطلبات بعد الـ 30 تعيد `429 Too Many Requests`
- [ ] إرسال طلب بـ signature خاطئة → يعيد `403 Forbidden`
- [ ] `storage/logs/laravel.log` يسجل محاولات الـ signature مismatch
- [ ] التحقق من Webhook الأصلي من Meta لا يتأثر (GET verification يعمل بشكل سليم)

---

### 🔴 TASK-003 · اكتمال مفاتيح Gemini في `.env`

**الأولوية:** P0 · **المسؤول:** DevOps / Backend Lead  
**الوقت المقدر:** 1-2 ساعة  
**السبب:** النظام لا يعمل بدون مفاتيح AI صحيحة — هذا يشل الميزة الأساسية للمنتج.

#### الخطوات التنفيذية:

**الخطوة 1 — الحصول على مفاتيح Gemini**
1. اذهب إلى: `https://aistudio.google.com/app/apikey`
2. أنشئ API Key جديد مخصص للإنتاج (لا تستخدم مفتاح التطوير)
3. سمّه: `o2oeg-production`
4. فعّل `Gemini 1.5 Pro` أو `Gemini 2.0 Flash` حسب الميزانية

**الخطوة 2 — تحديث `.env` على السيرفر**
```dotenv
# Gemini AI Configuration
GEMINI_API_KEY=AIzaSy_YOUR_PRODUCTION_KEY_HERE
GEMINI_MODEL=gemini-2.0-flash   # أو gemini-1.5-pro للدقة العالية

# WhatsApp Business API
WHATSAPP_TOKEN=EAAxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id
WHATSAPP_APP_SECRET=your_app_secret

# App Configuration
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
```

**الخطوة 3 — اختبار الاتصال بـ Gemini**
```bash
# اختبار سريع من command line
php artisan tinker

# داخل Tinker:
$client = new \GuzzleHttp\Client();
$response = $client->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . config('services.gemini.api_key'), [
    'json' => [
        'contents' => [['parts' => [['text' => 'Say hello in Arabic']]]]
    ]
]);
echo $response->getBody();
```

**الخطوة 4 — تشفير الـ Keys في قاعدة البيانات**

تأكد أن `AIController.php` يجلب المفتاح من قاعدة البيانات (مشفر) وليس من `.env` مباشرة عند التعامل مع مفاتيح الـ Tenants:

```php
// في AIController أو WillAIController
$geminiKey = decrypt($tenant->gemini_api_key) ?? config('services.gemini.api_key');
```

**الخطوة 5 — تحديث الـ Cache**
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### ✅ Acceptance Criteria — TASK-003:
- [ ] `php artisan tinker` → استدعاء Gemini API يعيد response ناجح
- [ ] ارسل رسالة واتساب تجريبية → الـ AI يرد خلال 10 ثواني
- [ ] `APP_DEBUG=false` مؤكدة في الإنتاج
- [ ] لا يظهر أي API key في الـ logs

---

## 3. المرحلة الثانية — اختبار بيئة الإنتاج (يوم 4–6)

### 🟡 TASK-004 · اعتماد قوالب WhatsApp Business من Meta

**الأولوية:** P1 · **المسؤول:** Product + Backend Lead  
**الوقت المقدر:** 4-24 ساعة (وقت اعتماد Meta متغير)

#### الخطوات التنفيذية:

**الخطوة 1 — تحديد القوالب المطلوبة**

| القالب | الغرض | نوع البيانات |
|--------|--------|-------------|
| `booking_confirmation` | تأكيد الحجز | اسم العميل، الخدمة، التاريخ، الوقت |
| `booking_reminder` | تذكير 24 ساعة قبل الموعد | اسم العميل، الخدمة، الوقت |
| `booking_cancellation` | إلغاء الحجز | اسم العميل، سبب الإلغاء |
| `welcome_message` | رسالة ترحيب للعميل الجديد | اسم الصالون |

**الخطوة 2 — إنشاء القوالب عبر Meta Business Manager**

```
1. اذهب إلى: https://business.facebook.com/
2. اختر: WhatsApp Manager → Message Templates → Create Template
3. لكل قالب:
   - Category: UTILITY (للتأكيدات والتذكيرات)
   - Language: Arabic (ar)
   - Name: booking_confirmation (lowercase, underscores فقط)
```

**مثال على نص قالب `booking_confirmation`:**
```
مرحباً {{1}}،

تم تأكيد حجزك بنجاح! 🎉

📋 التفاصيل:
• الخدمة: {{2}}
• الموظف: {{3}}
• التاريخ: {{4}}
• الوقت: {{5}}

📍 {{6}}

لإلغاء أو تعديل الموعد، أرسل "الغاء" أو تواصل معنا.
```

**الخطوة 3 — تحديث كود الإرسال بعد الاعتماد**

```php
// app/Services/WhatsAppService.php

public function sendBookingConfirmation(Booking $booking): void
{
    $this->sendTemplate(
        phone: $booking->customer->whatsapp_phone,
        templateName: 'booking_confirmation',
        languageCode: 'ar',
        components: [
            [
                'type' => 'body',
                'parameters' => [
                    ['type' => 'text', 'text' => $booking->customer->name],
                    ['type' => 'text', 'text' => $booking->service->name],
                    ['type' => 'text', 'text' => $booking->staff->name],
                    ['type' => 'text', 'text' => $booking->date->format('d/m/Y')],
                    ['type' => 'text', 'text' => $booking->time],
                    ['type' => 'text', 'text' => $booking->tenant->address],
                ]
            ]
        ]
    );
}

private function sendTemplate(string $phone, string $templateName, string $languageCode, array $components): void
{
    $url = "https://graph.facebook.com/v19.0/{$this->phoneNumberId}/messages";
    
    Http::withToken($this->token)->post($url, [
        'messaging_product' => 'whatsapp',
        'to' => $phone,
        'type' => 'template',
        'template' => [
            'name' => $templateName,
            'language' => ['code' => $languageCode],
            'components' => $components,
        ]
    ]);
}
```

#### ✅ Acceptance Criteria — TASK-004:
- [ ] جميع القوالب الأربعة بحالة `APPROVED` في Meta Business Manager
- [ ] إرسال تأكيد حجز حقيقي → يصل على الواتساب بتنسيق صحيح
- [ ] لا تُرسَل رسائل خارج القوالب المعتمدة في الإنتاج

---

### 🟡 TASK-005 · AI Rate Limiting لكل Tenant

**الأولوية:** P1 · **المسؤول:** Backend Lead  
**الوقت المقدر:** 3-4 ساعات  
**السبب:** بدون سقف، tenant واحد يمكن أن يستهلك ميزانية AI الكاملة للمنصة.

#### الخطوات التنفيذية:

**الخطوة 1 — إضافة حقول الـ Limits في جدول `plans`**

```php
// database/migrations/xxxx_add_ai_limits_to_plans_table.php

Schema::table('plans', function (Blueprint $table) {
    $table->integer('ai_daily_limit')->default(100)->after('price');
    $table->integer('ai_monthly_limit')->default(2000)->after('ai_daily_limit');
});
```
```bash
php artisan migrate
```

**الخطوة 2 — إنشاء AI Usage Tracker Service**

```php
// app/Services/AIUsageService.php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;

class AIUsageService
{
    public function canUseAI(Tenant $tenant): bool
    {
        $plan = $tenant->currentPlan;
        
        if (!$plan) return false;

        $dailyUsage   = $this->getDailyUsage($tenant->id);
        $monthlyUsage = $this->getMonthlyUsage($tenant->id);

        return $dailyUsage < $plan->ai_daily_limit
            && $monthlyUsage < $plan->ai_monthly_limit;
    }

    public function incrementUsage(Tenant $tenant): void
    {
        $dailyKey   = "ai_usage:{$tenant->id}:daily:" . now()->format('Y-m-d');
        $monthlyKey = "ai_usage:{$tenant->id}:monthly:" . now()->format('Y-m');

        Cache::increment($dailyKey);
        Cache::increment($monthlyKey);

        // تعيين TTL إذا كان المفتاح جديداً
        if (Cache::get($dailyKey) === 1) {
            Cache::put($dailyKey, 1, now()->endOfDay());
        }
        if (Cache::get($monthlyKey) === 1) {
            Cache::put($monthlyKey, 1, now()->endOfMonth());
        }
    }

    public function getDailyUsage(int $tenantId): int
    {
        return (int) Cache::get("ai_usage:{$tenantId}:daily:" . now()->format('Y-m-d'), 0);
    }

    public function getMonthlyUsage(int $tenantId): int
    {
        return (int) Cache::get("ai_usage:{$tenantId}:monthly:" . now()->format('Y-m'), 0);
    }

    public function getRemainingRequests(Tenant $tenant): array
    {
        $plan = $tenant->currentPlan;
        return [
            'daily_remaining'   => max(0, $plan->ai_daily_limit - $this->getDailyUsage($tenant->id)),
            'monthly_remaining' => max(0, $plan->ai_monthly_limit - $this->getMonthlyUsage($tenant->id)),
        ];
    }
}
```

**الخطوة 3 — تطبيق الـ Check في `AIController.php`**

```php
// في AIController.php — داخل handleWebhook أو WillAI endpoint

public function handleWebhook(Request $request): JsonResponse
{
    $tenant = $this->identifyTenant($request);
    
    // التحقق من الـ AI Usage Limit
    if (!app(AIUsageService::class)->canUseAI($tenant)) {
        $this->sendWhatsAppMessage(
            $tenant,
            $request->input('entry.0.changes.0.value.messages.0.from'),
            'عذراً، لقد وصلت إلى الحد اليومي للاستشارات الذكية. يرجى التواصل معنا مباشرة أو الترقية إلى باقة أعلى.'
        );
        
        \Log::info('AI limit reached for tenant', ['tenant_id' => $tenant->id]);
        return response()->json(['status' => 'limit_reached']);
    }

    // تسجيل الاستخدام بعد نجاح الـ AI call
    $aiResponse = $this->callGeminiAI($tenant, $messageContent);
    app(AIUsageService::class)->incrementUsage($tenant);

    // ... باقي المنطق
}
```

**الخطوة 4 — إضافة Cache Driver مناسب**

```dotenv
# في .env — استخدم Redis في الإنتاج لأداء أفضل
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# تثبيت extension PHP
composer require predis/predis
```

#### ✅ Acceptance Criteria — TASK-005:
- [ ] Tenant على الباقة المجانية يُوقف بعد 100 استشارة يومياً
- [ ] رسالة واضحة تُرسل للعميل عند الوصول للحد
- [ ] `php artisan tinker` → `AIUsageService::getRemainingRequests($tenant)` يعيد قيماً صحيحة
- [ ] Redis يعمل وCache يُخزَّن بشكل صحيح

---

### 🟡 TASK-006 · إعداد Queue System للإنتاج

**الأولوية:** P1 · **المسؤول:** DevOps  
**الوقت المقدر:** 2-3 ساعات

#### الخطوات التنفيذية:

**الخطوة 1 — تحويل Queue Driver إلى Redis**
```dotenv
QUEUE_CONNECTION=redis
```

**الخطوة 2 — إعداد Supervisor لتشغيل Queue Workers**

```bash
sudo apt install -y supervisor
sudo nano /etc/supervisor/conf.d/o2oeg-worker.conf
```

```ini
[program:o2oeg-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/o2oeg-api/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=3
redirect_stderr=true
stdout_logfile=/var/log/o2oeg-worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start o2oeg-worker:*
sudo supervisorctl status
```

**الخطوة 3 — إضافة Failed Jobs Monitoring**
```bash
php artisan queue:failed-table
php artisan migrate
```

```php
// app/Providers/AppServiceProvider.php
Queue::failing(function (JobFailed $event) {
    \Log::error('Queue job failed', [
        'job'       => $event->job->getName(),
        'exception' => $event->exception->getMessage(),
    ]);
    // يمكن إضافة إشعار Slack أو Email هنا
});
```

#### ✅ Acceptance Criteria — TASK-006:
- [ ] `sudo supervisorctl status` يظهر 3 workers بحالة `RUNNING`
- [ ] ارسال رسالة واتساب → تُعالَج عبر Queue وليس synchronously
- [ ] `php artisan queue:failed` يعمل ولا توجد failed jobs

---

## 4. المرحلة الثالثة — Soft Launch (يوم 7–10)

### 🟡 TASK-007 · إعداد CI/CD Pipeline

**الأولوية:** P1 · **المسؤول:** DevOps  
**الوقت المقدر:** 4-6 ساعات

#### الخطوات التنفيذية:

**الخطوة 1 — إنشاء GitHub Actions Workflow**

```yaml
# .github/workflows/deploy-production.yml

name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mbstring, bcmath, mysql
      
      - name: Install dependencies
        run: composer install --no-dev --optimize-autoloader
      
      - name: Run Tests
        run: php artisan test --parallel

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/o2oeg-api
            git pull origin main
            composer install --no-dev --optimize-autoloader
            php artisan migrate --force
            php artisan config:cache
            php artisan route:cache
            php artisan view:cache
            sudo supervisorctl restart o2oeg-worker:*
            php artisan queue:restart
```

**الخطوة 2 — إعداد GitHub Secrets**

في GitHub Repository → Settings → Secrets:
```
SERVER_HOST      = IP السيرفر
SERVER_USER      = اسم المستخدم (www-data أو ubuntu)
SSH_PRIVATE_KEY  = مفتاح SSH الخاص
```

**الخطوة 3 — Deploy الـ Frontend**

```yaml
# .github/workflows/deploy-frontend.yml

name: Deploy Frontend

on:
  push:
    branches: [ main ]
    paths: [ 'frontend/**' ]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install & Build
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Upload to Server
        uses: appleboy/scp-action@v0.1.4
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "frontend/dist/*"
          target: "/var/www/o2oeg-frontend/"
```

#### ✅ Acceptance Criteria — TASK-007:
- [ ] Push إلى `main` → يبدأ الـ pipeline تلقائياً
- [ ] Deployment يكتمل خلال أقل من 5 دقائق
- [ ] Zero-downtime: لا يتوقف الموقع أثناء النشر

---

### 🟢 TASK-008 · Monitoring & Alerting

**الأولوية:** P2 · **المسؤول:** DevOps  
**الوقت المقدر:** 3-4 ساعات

#### الخطوات التنفيذية:

**الخطوة 1 — إضافة Health Check Endpoint**

```php
// routes/api.php
Route::get('/health', function () {
    return response()->json([
        'status'   => 'ok',
        'database' => DB::connection()->getPdo() ? 'connected' : 'error',
        'cache'    => Cache::put('health_check', true, 10) ? 'ok' : 'error',
        'queue'    => Queue::size() < 1000 ? 'ok' : 'warning',
        'timestamp'=> now()->toISOString(),
    ]);
});
```

**الخطوة 2 — إعداد UptimeRobot (مجاني)**

```
1. اذهب إلى: https://uptimerobot.com
2. أضف Monitor جديد:
   - Type: HTTP(s)
   - URL: https://your-domain.com/api/health
   - Interval: 5 minutes
3. أضف Alert Contact: بريدك الإلكتروني أو Telegram
```

**الخطوة 3 — Log Monitoring**

```php
// config/logging.php — أضف channel للأخطاء الحرجة

'channels' => [
    'critical' => [
        'driver' => 'stack',
        'channels' => ['daily', 'slack'],
    ],
    'slack' => [
        'driver' => 'slack',
        'url'    => env('LOG_SLACK_WEBHOOK_URL'),
        'level'  => 'critical',
    ],
]
```

```dotenv
LOG_CHANNEL=daily
LOG_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### ✅ Acceptance Criteria — TASK-008:
- [ ] `GET /api/health` يعيد `200 OK` مع تفاصيل صحيحة
- [ ] UptimeRobot يرسل إشعار خلال 5 دقائق من أي downtime
- [ ] الأخطاء الحرجة تصل Slack فوراً

---

### 🟢 TASK-009 · Soft Launch مع 3 صالونات مختارة

**الأولوية:** P2 · **المسؤول:** Product + Sales  
**الوقت المقدر:** يوم كامل

#### معايير اختيار الصالونات التجريبية:

| المعيار | التفصيل |
|---------|---------|
| الحجم | صالون متوسط (3-10 موظفين) |
| التقنية | صاحب الصالون مرتاح للتقنية |
| الموقع | في نفس المنطقة للدعم السريع |
| العلاقة | علاقة جيدة مع الفريق للحصول على Feedback صريح |

#### خطة Onboarding التجريبي:

```
اليوم 1: Onboarding Session (2 ساعة)
  ├── إنشاء حساب Tenant
  ├── إضافة الخدمات والموظفين
  ├── ربط رقم واتساب
  └── اختبار حجز تجريبي

اليوم 2-3: مراقبة فعلية
  ├── مراجعة logs كل 4 ساعات
  ├── قياس response time للـ AI
  └── جمع feedback مباشر

اليوم 4-7: تحليل وتحسين
  ├── إصلاح أي bugs تظهر
  └── تحضير للتوسع
```

#### ✅ Acceptance Criteria — TASK-009:
- [ ] 3 صالونات تعمل بشكل مستقل بدون تدخل تقني
- [ ] معدل نجاح الحجز عبر AI أكثر من 80%
- [ ] لا توجد أخطاء P0 خلال أسبوع الـ Soft Launch
- [ ] جمع feedback موثق من كل صالون

---

## 5. المهام التقنية التفصيلية

### 🔧 TASK-010 · إعداد Nginx + SSL

```nginx
# /etc/nginx/sites-available/o2oeg-api

server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    root /var/www/o2oeg-api/public;
    index index.php;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Webhook — لا تطبق cache عليه
    location /api/webhook {
        try_files $uri $uri/ /index.php?$query_string;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    # حجب الوصول لملفات حساسة
    location ~ /\.(env|git) {
        deny all;
    }
}
```

```bash
# تثبيت SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com -d your-domain.com

# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/o2oeg-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

### 🔧 TASK-011 · Backup Strategy

```bash
# /etc/cron.d/o2oeg-backup

# Backup قاعدة البيانات يومياً في 2 صباحاً
0 2 * * * www-data /var/www/o2oeg-api/scripts/backup.sh

# تنظيف backups أقدم من 30 يوم
0 3 * * * www-data find /backups/mysql -name "*.sql.gz" -mtime +30 -delete
```

```bash
#!/bin/bash
# /var/www/o2oeg-api/scripts/backup.sh

DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_DIR="/backups/mysql"
DB_NAME="o2oeg_production"

mkdir -p $BACKUP_DIR

mysqldump -u o2oeg_user -p"$DB_PASSWORD" $DB_NAME | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

echo "Backup completed: backup_$DATE.sql.gz"
```

---

## 6. معايير القبول الإجمالية

### ✅ GO / NO-GO Checklist — قبل أي إطلاق

```
قاعدة البيانات
  ☐ MySQL يعمل في الإنتاج (لا SQLite)
  ☐ جميع الـ 42 Migration بحالة Ran
  ☐ Backup يومي مفعّل ومختبر

الأمان
  ☐ HTTPS مفعّل على جميع المسارات
  ☐ APP_DEBUG=false في .env
  ☐ Rate Limiting على Webhook
  ☐ Webhook Signature Verification يعمل
  ☐ لا توجد API keys في الـ logs

الذكاء الاصطناعي
  ☐ مفاتيح Gemini مؤكدة في الإنتاج
  ☐ AI يرد على رسائل واتساب في أقل من 15 ثانية
  ☐ AI Usage Limits مفعّلة لكل Tenant
  ☐ رسالة واضحة عند الوصول للحد

واتساب
  ☐ جميع القوالب معتمدة من Meta
  ☐ تأكيد الحجز يصل بشكل صحيح
  ☐ Webhook يستقبل الرسائل بدون أخطاء

الأداء
  ☐ Response time للـ API أقل من 500ms
  ☐ Queue Workers تعمل عبر Supervisor
  ☐ Redis Cache مفعّل

المراقبة
  ☐ Health Check endpoint يعمل
  ☐ UptimeRobot مفعّل
  ☐ Log rotation مفعّل
  ☐ Slack alerts للأخطاء الحرجة

CI/CD
  ☐ GitHub Actions Pipeline يعمل
  ☐ Deploy يكتمل بدون downtime
```

### مقاييس النجاح بعد Soft Launch

| المقياس | الهدف | الحد الأدنى |
|---------|-------|------------|
| Uptime | 99.5% | 99% |
| AI Response Time | أقل من 10 ثواني | أقل من 20 ثانية |
| Booking Success Rate | أكثر من 85% | أكثر من 70% |
| WhatsApp Message Delivery | أكثر من 98% | أكثر من 95% |
| API Response Time | أقل من 300ms | أقل من 700ms |

---

## 7. خطة الطوارئ

### 🚨 سيناريوهات الطوارئ وكيفية التعامل

#### السيناريو 1: تعطل قاعدة البيانات

```bash
# التشخيص
sudo systemctl status mysql
tail -100 /var/log/mysql/error.log

# الإصلاح السريع
sudo systemctl restart mysql

# إذا لم يعمل — استعادة من Backup
gunzip < /backups/mysql/backup_LATEST.sql.gz | mysql -u o2oeg_user -p o2oeg_production
```

#### السيناريو 2: Webhook يتوقف عن الاستقبال

```bash
# التحقق
curl -X POST https://api.your-domain.com/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# إعادة تشغيل Queue
sudo supervisorctl restart o2oeg-worker:*
php artisan queue:restart

# مراجعة الـ logs
tail -200 /var/log/o2oeg-worker.log
```

#### السيناريو 3: Gemini API معطل

```php
// app/Services/AIFallbackService.php
// خطة بديلة: رد آلي بدون AI

public function getFallbackResponse(string $intent): string
{
    return match($intent) {
        'booking' => 'شكراً لتواصلك معنا! فريقنا سيتواصل معك خلال دقائق لتأكيد موعدك.',
        'inquiry' => 'شكراً لاستفسارك! يمكنك زيارتنا أو الاتصال بنا مباشرة.',
        default   => 'شكراً لرسالتك! سيتواصل معك أحد ممثلينا قريباً.',
    };
}
```

#### السيناريو 4: Rollback في حالة Deployment فاشل

```bash
# GitHub Actions — إضافة Rollback step
- name: Rollback if deploy failed
  if: failure()
  run: |
    cd /var/www/o2oeg-api
    git reset --hard HEAD~1
    composer install --no-dev --optimize-autoloader
    php artisan config:cache
    sudo supervisorctl restart o2oeg-worker:*
```

---

## 📊 ملخص تنفيذي — Timeline

```
يوم 1 → TASK-001 (MySQL) + TASK-003 (Gemini Keys)
يوم 2 → TASK-002 (Rate Limiting) + TASK-010 (Nginx+SSL)
يوم 3 → TASK-005 (AI Limits) + TASK-006 (Queue)
يوم 4 → TASK-004 (WhatsApp Templates — انتظار Meta)
يوم 5 → TASK-007 (CI/CD) + اختبار شامل
يوم 6 → TASK-008 (Monitoring) + GO/NO-GO Review
يوم 7 → 🚀 SOFT LAUNCH مع 3 صالونات
يوم 8-10 → مراقبة وتحسين مستمر
```

---

**توقيع المراجعة:**  
رئيس مجلس الإدارة · Antigravity AI  
**الحالة:** جاهز للتنفيذ الفوري 🫡

---

*آخر تحديث: 2026-04-27 · الإصدار 1.0*
