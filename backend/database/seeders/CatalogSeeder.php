<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\CrmOrder;
use App\Models\CrmOrderItem;
use App\Models\CrmClient;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $company = Tenant::where('business_category', 'company')->first();
        if (!$company) return;

        // 1. إضافة منتجات للكتالوج
        $products = [
            ['name' => 'مجموعة صبغات iNOA الأساسية', 'price' => 1200, 'retail' => 1600, 'stock' => 50, 'category' => 'صبغات'],
            ['name' => 'شامبو لوريال Metal Detox', 'price' => 850, 'retail' => 1100, 'stock' => 100, 'category' => 'عناية بالشعر'],
            ['name' => 'سيروم Absolut Repair', 'price' => 950, 'retail' => 1250, 'stock' => 75, 'category' => 'ترطيب وإصلاح'],
            ['name' => 'بودرة تفتيح Blond Studio', 'price' => 1500, 'retail' => 1900, 'stock' => 30, 'category' => 'تفتيح'],
        ];

        foreach ($products as $p) {
            Product::create([
                'tenant_id' => $company->id,
                'name' => $p['name'],
                'description' => 'منتج احترافي للعناية بالشعر من لوريال بروفيسيونال.',
                'wholesale_price' => $p['price'],
                'retail_price' => $p['retail'],
                'stock_quantity' => $p['stock'],
                'category' => $p['category'],
                'is_active' => true,
                'image_url' => 'https://via.placeholder.com/300'
            ]);
        }

        // 2. إضافة طلبات تجريبية من الصالونات
        $salons = CrmClient::where('tenant_id', $company->id)->get();
        if ($salons->isEmpty()) {
            // Create a few salons if none exist for this tenant
            foreach (['لوزا بيوتي', 'بيوتي هاوس'] as $name) {
                $salons->push(CrmClient::create([
                    'tenant_id' => $company->id,
                    'salon_name' => $name,
                    'phone' => '010' . rand(11111111, 99999999),
                    'city' => 'القاهرة',
                    'size' => 'medium',
                    'tier' => 'regular'
                ]));
            }
        }
        $dbProducts = Product::where('tenant_id', $company->id)->get();

        foreach ($salons->take(2) as $salon) {
            $order = CrmOrder::create([
                'tenant_id' => $company->id,
                'crm_client_id' => $salon->id,
                'total_amount' => 0,
                'status' => 'pending',
                'notes' => 'يرجى التوصيل في أسرع وقت.'
            ]);

            $total = 0;
            foreach ($dbProducts->take(2) as $prod) {
                $qty = rand(1, 5);
                $price = $prod->wholesale_price;
                $total += ($price * $qty);

                CrmOrderItem::create([
                    'crm_order_id' => $order->id,
                    'product_id' => $prod->id,
                    'quantity' => $qty,
                    'price_at_order' => $price
                ]);
            }

            $order->update(['total_amount' => $total]);
        }
    }
}
