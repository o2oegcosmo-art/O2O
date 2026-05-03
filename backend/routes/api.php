<?php

use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\BookingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TenantServiceController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\CrmController;
use App\Http\Controllers\Api\CrmAIController;
use App\Http\Controllers\Api\WhatsAppCampaignController;
use App\Http\Controllers\Api\CrmReportController;
use App\Http\Controllers\Api\SalesTeamController;
use App\Http\Controllers\Api\CrmOrderController;
use App\Http\Controllers\Api\EducationROIController;
use App\Http\Controllers\Api\RetailOrderController;

use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\WorkingHourController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\WillAIController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\DiscoveryController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\ProductCatalogController;
use App\Http\Controllers\AffiliateController;


Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1'); 
Route::post('/register', [AuthController::class, 'register']); 

// مسارات الـ Webhook مع Rate Limiting مشدد وحماية Signature
Route::middleware(['throttle:webhook'])->group(function () {
    Route::get('/webhooks/whatsapp', [AIController::class, 'verifyWebhook']);
});

Route::middleware(['throttle:ai_webhook', 'verify.whatsapp'])->group(function () {
    Route::post('/webhooks/whatsapp', [AIController::class, 'handleWebhook']);
});

Route::middleware(['auth:sanctum', 'tenant.integrations'])->group(function () {
    // 1. مسارات الحساب الشخصي
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/me', [AuthController::class, 'me']); // ← بيانات Dashboard الكاملة
    
    // مسارات الإعلانات والفعاليات
    Route::get('/events/promoted-ad', [EventController::class, 'getPromotedAd']);
    Route::post('/events/{id}/track-click', [EventController::class, 'trackClick']);
    Route::post('/events', [EventController::class, 'store']);
    
    // مسارات لوحة تحكم الشركات
    Route::get('/company/events', [EventController::class, 'myEvents']);
    Route::get('/company/stats', [EventController::class, 'getStats']);

    // مسارات CRM الشركات
    Route::get('/crm/clients', [CrmController::class, 'clientsIndex']);
    Route::post('/crm/clients', [CrmController::class, 'clientsStore']);
    Route::get('/crm/pipeline', [CrmController::class, 'pipelineIndex']);
    Route::patch('/crm/pipeline/{id}', [CrmController::class, 'pipelineUpdate']);
    Route::get('/crm/stats', [CrmController::class, 'stats']);
    Route::post('/crm/ai-consult', [CrmAIController::class, 'consult']);
    Route::get('/crm/ai-suggestions', [CrmAIController::class, 'suggestActions']);
    
    // مسارات حملات الواتساب (WhatsApp Campaign Engine)
    Route::get('/whatsapp/campaigns', [WhatsAppCampaignController::class, 'index']);
    Route::post('/whatsapp/campaigns', [WhatsAppCampaignController::class, 'store']);
    Route::post('/whatsapp/campaigns/{id}/start', [WhatsAppCampaignController::class, 'start']);
    Route::post('/whatsapp/campaigns/{id}/pause', [WhatsAppCampaignController::class, 'pause']);
    Route::get('/whatsapp/campaigns/{id}/stats', [WhatsAppCampaignController::class, 'stats']);
    Route::post('/whatsapp/generate-message', [WhatsAppCampaignController::class, 'generateMessage']);
    
    Route::get('/crm/reports', [CrmReportController::class, 'getFullReport']);
    
    // مسارات فريق المبيعات
    Route::get('/crm/sales-team', [SalesTeamController::class, 'index']);
    Route::get('/crm/visits', [SalesTeamController::class, 'visits']);
    Route::post('/crm/visits', [SalesTeamController::class, 'storeVisit']);
    
    // مسارات الطلبات والكتالوج
    Route::get('/crm/orders', [CrmOrderController::class, 'index']);
    Route::get('/crm/catalog', [CrmOrderController::class, 'catalog']);
    Route::post('/crm/catalog', [CrmOrderController::class, 'storeProduct']);
    Route::patch('/crm/catalog/{id}', [CrmOrderController::class, 'updateProduct']);
    Route::post('/crm/orders', [CrmOrderController::class, 'store']);
    Route::patch('/crm/orders/{id}/status', [CrmOrderController::class, 'updateStatus']);

    // مسارات التدريب و ROI
    Route::get('/crm/education/stylists', [EducationROIController::class, 'index']);
    Route::get('/crm/education/roi', [EducationROIController::class, 'roiReport']);
    Route::post('/crm/education/certify', [EducationROIController::class, 'certify']);

    // 2. مسارات الإدارة العامة (Admin Portal)
    Route::prefix('admin')->middleware('can:admin-access')->group(function() {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/messages', [AdminController::class, 'messages']);
        Route::get('/support-tickets', [AdminController::class, 'supportTickets']);
        Route::get('/ai-security/logs', [AdminController::class, 'aiSecurityLogs']);
        Route::patch('/support-tickets/{id}', [AdminController::class, 'updateTicket']);
        Route::get('/tenant-services', [TenantServiceController::class, 'index']);
        Route::patch('/tenants/{id}/toggle-status', [AdminController::class, 'toggleTenantStatus']);
        Route::get('/services', [TenantServiceController::class, 'allServices']);
        Route::post('/tenant-services/toggle', [TenantServiceController::class, 'toggleService']);
        Route::get('/companies/{id}/stats', [AdminController::class, 'companyStats']);
        Route::get('/all-events', [AdminController::class, 'events']);
        Route::patch('/events/{id}/status', [AdminController::class, 'updateEventStatus']);
        
        // مخزن المنتجات المركزي
        Route::get('/products', [ProductCatalogController::class, 'index']);
        Route::get('/products/stats', [ProductCatalogController::class, 'stats']);
        Route::patch('/products/{id}/status', [ProductCatalogController::class, 'updateStatus']);
        Route::delete('/products/{id}', [ProductCatalogController::class, 'destroy']);

        // إدارة الباقات والأسعار
        Route::post('/plans', [PlanController::class, 'store']);
        Route::put('/plans/{id}', [PlanController::class, 'update']);
        Route::delete('/plans/{id}', [PlanController::class, 'destroy']);

        // مسارات التحقق من المدفوعات
        Route::get('/payments/pending', [PaymentController::class, 'adminIndex']);
        Route::patch('/payments/{id}/verify', [PaymentController::class, 'adminVerify']);

        // Affiliate Admin
        Route::get('/affiliates', [AffiliateController::class, 'adminIndex']);
        Route::post('/affiliates', [AffiliateController::class, 'adminStore']);
        Route::patch('/affiliates/{id}/toggle-status', [AffiliateController::class, 'adminToggleStatus']);
        Route::patch('/affiliates/commissions/{id}/status', [AffiliateController::class, 'adminUpdateCommissionStatus']);
        Route::post('/affiliates/{id}/payout', [AffiliateController::class, 'adminPayout']);
    });

    // Leads Admin (Outside nested admin prefix for clarity)
    Route::get('/admin/leads', [LeadController::class, 'index'])->middleware('can:admin-access');
    Route::put('/admin/leads/{id}/status', [LeadController::class, 'updateStatus'])->middleware('can:admin-access');

    // 3. مسارات نظام الحجوزات وخدمات الصالون (محمية باشتراك نشط)
    Route::middleware('subscription')->group(function () {
        Route::get('/bookings', [BookingController::class, 'index']);
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::patch('/bookings/{id}/status', [BookingController::class, 'updateStatus']);

        Route::get('/services', [ServiceController::class, 'index']);
        Route::post('/services', [ServiceController::class, 'store']);
        Route::put('/services/{service}', [ServiceController::class, 'update']);
        Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::put('/customers/{customer}', [CustomerController::class, 'update']);
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);

        Route::get('/staff', [StaffController::class, 'index']);
        Route::post('/staff', [StaffController::class, 'store']);
        Route::put('/staff/{staff}', [StaffController::class, 'update']);
        Route::patch('/staff/{staff}/status', [StaffController::class, 'updateStatus']);
        Route::delete('/staff/{staff}', [StaffController::class, 'destroy']);

        Route::get('/working-hours', [WorkingHourController::class, 'index']);
        Route::post('/working-hours', [WorkingHourController::class, 'update']);

        Route::get('/ai/will-ai', [WillAIController::class, 'getAdvice']);

        // مسارات المتجر الإلكتروني (B2C Retail Orders)
        Route::get('/retail/orders', [RetailOrderController::class, 'index']);
        Route::get('/retail/orders/stats', [RetailOrderController::class, 'stats']);
        Route::patch('/retail/orders/{id}/status', [RetailOrderController::class, 'updateStatus']);

        // مسارات النظام المالي (Finance)
        Route::get('/finance/stats', [\App\Http\Controllers\Api\FinancialController::class, 'getStats']);
        Route::get('/finance/expenses', [\App\Http\Controllers\Api\FinancialController::class, 'getExpenses']);
        Route::post('/finance/expenses', [\App\Http\Controllers\Api\FinancialController::class, 'storeExpense']);
        Route::delete('/finance/expenses/{id}', [\App\Http\Controllers\Api\FinancialController::class, 'destroyExpense']);
        Route::get('/finance/transactions', [\App\Http\Controllers\Api\FinancialController::class, 'getTransactions']);
    });

    // مسارات إعدادات الصالون (لا تتطلب اشتراكاً نشطاً ليتمكن من التعديل)
    Route::put('/salon/settings', [TenantController::class, 'update']);
    
    // مسارات Social Media Studio (AI Content Lab)
    Route::get('/content-studio/calendar', [\App\Http\Controllers\Api\ContentStudioController::class, 'getCalendar']);
    Route::post('/content-studio/generate-plan', [\App\Http\Controllers\Api\ContentStudioController::class, 'generateWeeklyPlan']);
    Route::post('/content-studio/generate-post', [\App\Http\Controllers\Api\ContentStudioController::class, 'generatePost']);
    Route::post('/content-studio/generate-ads-strategy', [\App\Http\Controllers\Api\ContentStudioController::class, 'generateAdsStrategy']);
    Route::post('/content-studio/post/{id}/ads-advice', [\App\Http\Controllers\Api\ContentStudioController::class, 'generateAdsAdvice']);
    Route::post('/content-studio/generate-product-description', [\App\Http\Controllers\Api\ContentStudioController::class, 'generateProductDescription']);

    // مسارات Social Publisher (Facebook & Instagram)
    Route::get('/social-publisher/posts', [\App\Http\Controllers\Api\SocialPublisherController::class, 'index']);
    Route::post('/social-publisher/generate-ai', [\App\Http\Controllers\Api\SocialPublisherController::class, 'generateAiContent']);
    Route::post('/social-publisher/generate-reel-script', [\App\Http\Controllers\Api\SocialPublisherController::class, 'generateAiReelScript']);
    Route::post('/social-publisher/publish', [\App\Http\Controllers\Api\SocialPublisherController::class, 'storeAndPublish']);

    // مسارات مركز الربط (Integrations Center) (موقوف مؤقتاً للتطوير)
    // Route::get('/integrations', [IntegrationController::class, 'index']);
    // Route::post('/integrations/connect', [IntegrationController::class, 'connect']);
    // Route::delete('/integrations/{provider}', [IntegrationController::class, 'destroy']);
    // Route::post('/integrations/test/{provider}', [IntegrationController::class, 'test']);

    // Affiliate Portal
    Route::get('/affiliate/stats', [AffiliateController::class, 'stats']);
    Route::get('/affiliate/commissions', [AffiliateController::class, 'commissions']);

    // مسارات الدفع اليدوي (Vodafone Cash / InstaPay) (لا تتطلب اشتراكاً)
    Route::post('/payments/manual', [PaymentController::class, 'submitManualPayment']);
});

// مسارات المحتوى العام
Route::get('/plans', [PlanController::class, 'index']);
Route::post('/leads', [LeadController::class, 'store'])->middleware('throttle:3,10');
Route::get('/leads/verify/{id}', [LeadController::class, 'verifyForCompletion']);
Route::post('/leads/convert/{id}', [LeadController::class, 'convertToUser']);
Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/{slug}', [ArticleController::class, 'show']);
Route::get('/events', [EventController::class, 'index']);

// مسارات الصالون العامة (المتجر الإلكتروني والحجز العام)
Route::get('/salons/{id}/public', [PublicController::class, 'getSalonProfile']);
Route::post('/salons/{id}/book', [PublicController::class, 'publicBook']);
Route::post('/salons/{id}/order', [PublicController::class, 'publicOrder']);
Route::post('/salons/ai-consult', [PublicController::class, 'aiConsult']);

// مسارات الاكتشاف الذكي (Smart Discovery)
Route::get('/discovery/salons', [DiscoveryController::class, 'search']);

// Affiliate Public Tracking
Route::get('/ref/{code}', [AffiliateController::class, 'trackClick']);
