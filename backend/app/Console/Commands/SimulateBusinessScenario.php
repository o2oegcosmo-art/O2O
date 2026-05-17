<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Service;
use App\Models\Plan;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SimulateBusinessScenario extends Command
{
    protected $signature = 'system:simulate-load';
    protected $description = 'Simulate a complex business scenario with companies, salons, bookings, and sales.';

    public function handle()
    {
        $this->info('🚀 Starting Business Logic Stress Test Simulation...');

        // 1. Create 3 Companies
        $this->info('🏢 Creating 3 Companies...');
        $companies = [];
        for ($i = 1; $i <= 3; $i++) {
            $tenant = Tenant::create([
                'id' => Str::uuid(),
                'name' => "Company Brand $i",
                'domain' => "company$i.o2oeg.local",
                'business_category' => 'company',
                'status' => 'active'
            ]);
            
            User::updateOrCreate(
                ['phone' => "0100000000$i"],
                [
                    'tenant_id' => $tenant->id,
                    'name' => "Manager $i",
                    'email' => "manager$i@company$i.com",
                    'password' => Hash::make('password123'),
                    'role' => 'admin'
                ]
            );

            for ($j = 1; $j <= 5; $j++) {
                DB::table('products')->insert([
                    'id' => Str::uuid(),
                    'tenant_id' => $tenant->id,
                    'name' => "Wholesale Product $j from Brand $i",
                    'description' => "Professional product",
                    'wholesale_price' => rand(100, 1000),
                    'stock_quantity' => rand(50, 200),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            $companies[] = $tenant;
        }

        // 2. Create 10 Salons
        $this->info('💇 Creating 10 Salons (6 Free, 4 Paid)...');
        $salons = [];
        $plans = [
            'free' => Plan::where('price', 0)->first() ?? Plan::create(['name' => 'Free', 'price' => 0]),
            'pro' => Plan::where('price', '>', 0)->first() ?? Plan::create(['name' => 'Pro', 'price' => 500])
        ];

        for ($i = 1; $i <= 10; $i++) {
            $isPaid = $i <= 4;
            $tenant = Tenant::create([
                'id' => Str::uuid(),
                'name' => "Salon $i " . ($isPaid ? '(Paid)' : '(Free)'),
                'domain' => "salon$i.o2oeg.local",
                'business_category' => 'salon',
                'status' => 'active'
            ]);

            DB::table('subscriptions')->insert([
                'id' => Str::uuid(),
                'tenant_id' => $tenant->id,
                'plan_id' => $isPaid ? $plans['pro']->id : $plans['free']->id,
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => now()->addMonth(),
            ]);

            Service::create([
                'tenant_id' => $tenant->id,
                'name' => 'Hair Cut',
                'price' => 200,
                'duration' => 30,
                'status' => 'active'
            ]);

            // Create a retail product for this salon
            $productId = Str::uuid();
            DB::table('products')->insert([
                'id' => $productId,
                'tenant_id' => $tenant->id,
                'name' => "Retail Shampoo $i",
                'wholesale_price' => 150,
                'stock_quantity' => 20,
                'created_at' => now(),
            ]);

            $salons[] = ['tenant' => $tenant, 'retail_product_id' => $productId];
        }

        // 3. 5 Salons buy from Companies
        $this->info('🛒 Simulating B2B Orders...');
        for ($i = 0; $i < 5; $i++) {
            $salon = $salons[$i]['tenant'];
            $company = $companies[rand(0, 2)];
            $clientId = Str::uuid();
            DB::table('crm_clients')->insert([
                'id' => $clientId, 'tenant_id' => $company->id, 'salon_name' => $salon->name, 'phone' => "0123456789$i", 'city' => 'Cairo', 'tier' => 'regular', 'created_at' => now(),
            ]);
            $product = DB::table('products')->where('tenant_id', $company->id)->first();
            DB::table('crm_orders')->insert([
                'id' => Str::uuid(), 'tenant_id' => $company->id, 'crm_client_id' => $clientId, 'total_amount' => $product->wholesale_price * 2, 'status' => 'pending', 'created_at' => now(),
            ]);
        }

        // 4. 30 Bookings
        $this->info('📅 Generating 30 Bookings...');
        for ($i = 1; $i <= 30; $i++) {
            $salonData = $salons[rand(0, 9)];
            $salon = $salonData['tenant'];
            $service = Service::where('tenant_id', $salon->id)->first();
            $customerId = DB::table('customers')->insertGetId(['tenant_id' => $salon->id, 'name' => "Customer $i", 'phone' => "012" . rand(10000000, 99999999), 'created_at' => now()]);
            DB::table('bookings')->insert([
                'tenant_id' => $salon->id, 'customer_id' => $customerId, 'service_id' => $service->id, 'appointment_at' => now()->addDays(rand(1, 5))->setTime(rand(10, 20), 0), 'duration_minutes' => 30, 'status' => 'confirmed', 'created_at' => now(),
            ]);
        }

        // 5. 16 Retail Sales
        $this->info('🛍️ Simulating 16 Retail Sales...');
        for ($i = 1; $i <= 16; $i++) {
            $salonData = $salons[rand(0, 9)];
            $salon = $salonData['tenant'];
            $productId = $salonData['retail_product_id'];
            $orderId = Str::uuid();

            DB::table('retail_orders')->insert([
                'id' => $orderId, 'tenant_id' => $salon->id, 'order_number' => "ORD-S" . str_pad($i, 5, '0', STR_PAD_LEFT), 'customer_name' => "Walk-in $i", 'customer_phone' => '01234567890', 'customer_address' => 'Salon Floor', 'total_amount' => 500, 'status' => 'confirmed', 'created_at' => now(),
            ]);
            DB::table('retail_order_items')->insert([
                'id' => Str::uuid(), 'order_id' => $orderId, 'product_id' => $productId, 'product_name' => 'Retail Shampoo', 'unit_price' => 500, 'quantity' => 1, 'subtotal' => 500, 'created_at' => now(),
            ]);
        }

        $this->info('--- Final Report ---');
        $this->info('✅ Simulation Completed Successfully!');
    }
}

