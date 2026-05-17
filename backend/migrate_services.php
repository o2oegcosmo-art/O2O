<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

// New Services Definition
$newServicesData = [
    ['name' => 'منظومة الحجوزات الذكية', 'slug' => 'smart-booking-system', 'description' => 'إدارة المواعيد والتقويم والمدفوعات والمساعد الآلي'],
    ['name' => 'نظام إدارة العملاء', 'slug' => 'crm-system', 'description' => 'سجل العملاء، برامج الولاء والتسويق المتقدم'],
    ['name' => 'الصفحة العامة', 'slug' => 'public-page', 'description' => 'موقع الصالون أو الشركة لعرض الخدمات'],
    ['name' => 'المتجر الإلكتروني', 'slug' => 'e-commerce', 'description' => 'بيع المنتجات مباشرة للعملاء'],
    ['name' => 'إدارة الفعاليات', 'slug' => 'events-management', 'description' => 'نظام الإعلانات والفعاليات الداخلية'],
];

$newServiceMap = [];
foreach ($newServicesData as $data) {
    $newServiceMap[$data['slug']] = Service::updateOrCreate(['slug' => $data['slug']], $data);
}

// Map old slugs to new slugs
$migrationMap = [
    'booking-engine' => 'smart-booking-system',
    'ai-booking' => 'smart-booking-system',
    'manual-payments' => 'smart-booking-system', // merged into booking
    'basic-crm' => 'crm-system',
    'crm' => 'crm-system',
    'marketing-studio' => 'crm-system', // if any
    'public-salon-page' => 'public-page',
    'retail-store' => 'e-commerce',
    'ads-events' => 'events-management',
];

// Get all tenants
$tenants = Tenant::all();
foreach ($tenants as $tenant) {
    $currentServiceIds = DB::table('tenant_service')->where('tenant_id', $tenant->id)->pluck('service_id')->toArray();
    $currentServices = Service::whereIn('id', $currentServiceIds)->pluck('slug')->toArray();
    
    $newServiceIdsToSync = [];
    foreach ($currentServices as $oldSlug) {
        if (isset($migrationMap[$oldSlug])) {
            $newSlug = $migrationMap[$oldSlug];
            $newServiceIdsToSync[] = $newServiceMap[$newSlug]->id;
        }
    }
    
    // Always give them at least smart-booking and crm if they had basics
    if (in_array('basic-dashboard', $currentServices) && !in_array($newServiceMap['smart-booking-system']->id, $newServiceIdsToSync)) {
        $newServiceIdsToSync[] = $newServiceMap['smart-booking-system']->id;
        $newServiceIdsToSync[] = $newServiceMap['crm-system']->id;
    }

    // Sync unique new IDs
    $newServiceIdsToSync = array_unique($newServiceIdsToSync);
    $tenant->services()->sync($newServiceIdsToSync);
}

// Now delete old services
$oldSlugs = array_keys($migrationMap);
$oldSlugs[] = 'basic-dashboard';
$oldSlugs[] = 'will-ai'; // we are moving Will AI to be a global feature, not a service module
Service::whereIn('slug', $oldSlugs)->delete();

echo "Services migrated successfully!\n";
