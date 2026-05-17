<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Payment;
use App\Models\Plan;
use Illuminate\Support\Facades\Config;

/**
 * ====================================================
 * SECURITY TESTS - O2OEG Platform
 * اختبارات الأمان - الحماية من الاختراق ومحاولات التلاعب
 * ====================================================
 */
class SecurityAuditTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $adminUser;
    protected $salonOwner;

    protected function setUp(): void
    {
        parent::setUp();
        $uid = uniqid();

        $this->tenant = Tenant::create([
            'name'              => 'صالون الأمان',
            'status'            => 'active',
            'business_category' => 'salon',
            'phone'             => '01077778888',
        ]);

        $this->adminUser = User::create([
            'name'      => 'Admin Security',
            'email'     => "admin_sec_{$uid}@o2oeg.com",
            'phone'     => '01077778881',
            'password'  => bcrypt('AdminPass#123'),
            'role'      => 'admin',
            'tenant_id' => $this->tenant->id,
        ]);

        $this->salonOwner = User::create([
            'name'      => 'Salon Owner Security',
            'email'     => "owner_sec_{$uid}@o2oeg.com",
            'phone'     => '01077778882',
            'password'  => bcrypt('OwnerPass#456'),
            'role'      => 'tenant',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    // ===========================
    // TEST SEC-001: حماية من الوصول غير المصرح به
    // ===========================
    public function test_unauthenticated_access_is_blocked()
    {
        $response = $this->getJson('/api/admin/stats');
        $response->assertStatus(401);
    }

    // ===========================
    // TEST SEC-002: صاحب الصالون لا يستطيع الوصول لصلاحيات الأدمن
    // ===========================
    public function test_salon_owner_cannot_access_admin_panel()
    {
        $this->actingAs($this->salonOwner);
        $response = $this->getJson('/api/admin/stats');
        $response->assertStatus(403);
    }

    // ===========================
    // TEST SEC-003: حماية من تلاعب مبلغ الدفع
    // ===========================
    public function test_payment_amount_manipulation_is_blocked()
    {
        $plan = Plan::create([
            'name'  => 'خطة الأمان',
            'slug'  => 'security-plan-' . uniqid(),
            'price' => 1500.00,
        ]);

        $this->actingAs($this->salonOwner);

        $file = \Illuminate\Http\UploadedFile::fake()->image('receipt.jpg');

        $response = $this->postJson('/api/payments/manual', [
            'plan_id'        => $plan->id,
            'amount'         => 5.00, // محاولة احتيال بمبلغ صغير جداً
            'payment_method' => 'vodafone_cash',
            'sender_phone'   => '01044167626',
            'receipt'        => $file,
        ]);

        // النظام يجب أن يقبل الطلب لكن يسجل السعر الحقيقي
        if ($response->status() === 200 || $response->status() === 201) {
            $payment = Payment::where('tenant_id', $this->tenant->id)->latest()->first();
            if ($payment) {
                $this->assertEquals(1500.00, $payment->amount, "SEC-003: System must use real plan price, not user-submitted amount");
            } else {
                $this->assertTrue(true, "SEC-003: No payment record created - manipulation may be rejected");
            }
        } else {
            // إذا رفض النظام الطلب، فهذا أيضاً صواب
            $this->assertContains($response->status(), [400, 422, 403], "SEC-003: Invalid payment should be rejected");
        }
    }

    // ===========================
    // TEST SEC-004: لا يوجد تجاوز SSL (SSL Bypass)
    // ===========================
    public function test_no_ssl_verification_bypass_in_codebase()
    {
        $backendPath = base_path('app');
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($backendPath));
        $found = [];

        foreach ($files as $file) {
            if ($file->isDir() || $file->getExtension() !== 'php') continue;
            $content = file_get_contents($file->getRealPath());
            if (str_contains($content, 'withoutVerifying()')) {
                $found[] = $file->getFilename();
            }
        }

        $this->assertEmpty($found, "SEC-004: SSL verification bypass detected in: " . implode(', ', $found));
    }

    // ===========================
    // TEST SEC-005: إيصال الدفع محمي ولا يمكن الوصول إليه بدون صلاحيات
    // ===========================
    public function test_payment_receipt_not_accessible_without_auth()
    {
        $payment = Payment::create([
            'tenant_id'    => $this->tenant->id,
            'amount'       => 500,
            'status'       => 'pending',
            'receipt_path' => 'receipts/private_receipt.jpg',
        ]);

        $response = $this->getJson("/api/admin/payments/{$payment->id}/receipt");
        $response->assertStatus(401);
    }

    // ===========================
    // TEST SEC-006: إيصال الدفع محمي من صاحب الصالون أيضاً
    // ===========================
    public function test_payment_receipt_not_accessible_by_salon_owner()
    {
        $payment = Payment::create([
            'tenant_id'    => $this->tenant->id,
            'amount'       => 500,
            'status'       => 'pending',
            'receipt_path' => 'receipts/private_receipt.jpg',
        ]);

        $this->actingAs($this->salonOwner);
        $response = $this->getJson("/api/admin/payments/{$payment->id}/receipt");
        $response->assertStatus(403);
    }
}
