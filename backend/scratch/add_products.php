<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

use App\Models\Tenant;
use App\Models\Product;
use Illuminate\Support\Str;

$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tenant = Tenant::where('phone', '01122334455')->first();

if (!$tenant) {
    echo "ERROR: Tenant not found.\n";
    exit(1);
}

$products = [
    [
        'name' => 'Luxe Color - Deep Red',
        'description' => 'صبغة شعر احترافية بلون أحمر عميق، تدوم طويلاً.',
        'price' => 250,
        'stock_quantity' => 50,
    ],
    [
        'name' => 'Keratin Smooth Shampoo',
        'description' => 'شامبو بالكيراتين لتنعيم الشعر وتغذيته.',
        'price' => 180,
        'stock_quantity' => 100,
    ],
    [
        'name' => 'Repairing Hair Mask',
        'description' => 'ماسك لإصلاح الشعر التالف والمجهد.',
        'price' => 220,
        'stock_quantity' => 30,
    ],
    [
        'name' => 'Silk Shine Serum',
        'description' => 'سيروم لإعطاء لمعان ونعومة فائقة للشعر.',
        'price' => 350,
        'stock_quantity' => 20,
    ],
    [
        'name' => 'Professional Styling Gel',
        'description' => 'جل تصفيف قوي الثبات للمحترفين.',
        'price' => 120,
        'stock_quantity' => 80,
    ]
];

foreach ($products as $p) {
    Product::create(array_merge($p, [
        'tenant_id' => $tenant->id,
        'id' => (string) Str::uuid(),
        'status' => 'active',
        'category' => 'Hair Care'
    ]));
}

echo "SUCCESS: 5 Products added to Vision Beauty Egypt.\n";
