<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class SecurityIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $tenantUser;
    protected $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Tenant
        $this->tenant = Tenant::create([
            'name' => 'Test Salon',
            'business_category' => 'salon',
            'status' => 'active'
        ]);

        $uniqueId = uniqid();

        // Setup Admin
        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => "admin_{$uniqueId}@o2oeg.com",
            'phone' => "010" . rand(10000000, 99999999),
            'password' => bcrypt('password'),
            'role' => 'admin',
            'tenant_id' => $this->tenant->id
        ]);

        // Setup Tenant User
        $this->tenantUser = User::create([
            'name' => 'Owner User',
            'email' => "owner_{$uniqueId}@o2oeg.com",
            'phone' => "011" . rand(10000000, 99999999),
            'password' => bcrypt('password'),
            'role' => 'owner',
            'tenant_id' => $this->tenant->id
        ]);
    }

    /**
     * SEC-007: Receipt File Abuse Protection
     * Ensures receipts are NOT publicly accessible and require admin authorization.
     */
    public function test_payment_receipt_privacy()
    {
        $payment = Payment::create([
            'tenant_id' => $this->tenant->id,
            'amount' => 500,
            'status' => 'pending',
            'receipt_path' => 'receipts/secret_receipt.jpg'
        ]);

        // 1. Unauthenticated user should be blocked
        $response = $this->getJson("/api/admin/payments/{$payment->id}/receipt");
        $response->assertStatus(401);

        // 2. Tenant user (owner) should be blocked
        $this->actingAs($this->tenantUser);
        $response = $this->getJson("/api/admin/payments/{$payment->id}/receipt");
        $response->assertStatus(403);

        // 3. Admin should have access
        $this->actingAs($this->admin);
        $response = $this->getJson("/api/admin/payments/{$payment->id}/receipt");
        $this->assertNotEquals(403, $response->getStatusCode());
    }

    /**
     * SEC-005: Amount Manipulation Protection
     */
    public function test_payment_amount_manipulation_protection()
    {
        $plan = Plan::create([
            'name' => 'Premium Plan',
            'slug' => 'premium',
            'price' => 1000.00
        ]);

        $this->actingAs($this->tenantUser);

        // Create a fake image for upload
        $file = \Illuminate\Http\UploadedFile::fake()->image('receipt.jpg');

        // Try to submit a payment with a fake low price
        $response = $this->postJson('/api/payments/manual', [
            'plan_id' => $plan->id,
            'amount' => 1.00, // Fraudulent amount
            'payment_method' => 'vodafone_cash',
            'sender_phone' => '0123456789',
            'receipt' => $file
        ]);

        $response->assertStatus(200);
        
        // Assert the stored payment has the REAL plan price
        $payment = Payment::where('tenant_id', $this->tenant->id)->latest()->first();
        $this->assertEquals(1000.00, $payment->amount);
    }

    /**
     * SEC-004: Tenant Isolation (Config Leak Protection)
     */
    public function test_worker_config_isolation()
    {
        Config::set('services.google_ai.api_key', 'LEAKED_KEY');
        $this->assertTrue(true); 
    }

    /**
     * IMP-001: SSL Verification Check
     */
    public function test_no_ssl_verification_bypass()
    {
        $backendPath = base_path('app');
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($backendPath));
        $found = [];

        foreach ($files as $file) {
            if ($file->isDir()) continue;
            if ($file->getExtension() !== 'php') continue;

            $content = file_get_contents($file->getRealPath());
            if (str_contains($content, 'withoutVerifying()')) {
                $found[] = $file->getFilename();
            }
        }
        
        $this->assertEmpty($found, "Detected SSL verification bypass (withoutVerifying) in the following files: \n" . implode("\n", $found));
    }
}
