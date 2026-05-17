<?php
$models = [
    'InventoryItem', 'RetailOrder', 'RetailOrderItem', 'StaffCommission', 'Expense', 
    'VideoProject', 'ContentPost', 'ContentCalendar', 'SocialPost', 'SocialPostLog', 
    'WhatsappCampaign', 'WhatsappMessage', 'WhatsappOptOut', 'WhatsappWarmupState', 
    'WillAiLog', 'WorkingHour', 'Message', 'Lead', 'MediaAsset', 'Payment', 
    'ServiceMaterial', 'SupportTicket', 'TenantIntegration', 'IntegrationLog'
];

foreach ($models as $modelName) {
    $path = "backend/app/Models/{$modelName}.php";
    if (!file_exists($path)) {
        echo "Missing: $modelName\n";
        continue;
    }

    $content = file_get_contents($path);
    
    // Add Import
    if (!str_contains($content, 'use App\Traits\BelongsToTenant;')) {
        $content = preg_replace('/namespace App\\\Models;/', "namespace App\Models;\n\nuse App\Traits\BelongsToTenant;", $content);
    }

    // Add Trait
    if (!str_contains($content, 'BelongsToTenant')) {
        if (str_contains($content, 'use HasFactory;')) {
            $content = str_replace('use HasFactory;', 'use HasFactory, BelongsToTenant;', $content);
        } elseif (str_contains($content, 'use HasFactory, HasUuids;')) {
            $content = str_replace('use HasFactory, HasUuids;', 'use HasFactory, HasUuids, BelongsToTenant;', $content);
        } else {
            $content = preg_replace('/class ' . $modelName . ' extends Model\n\{/', "class {$modelName} extends Model\n{\n    use BelongsToTenant;", $content);
        }
    }

    file_put_contents($path, $content);
    echo "Secured: $modelName\n";
}
