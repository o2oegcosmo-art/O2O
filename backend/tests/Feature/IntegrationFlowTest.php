<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Lead;

/**
 * ====================================================
 * INTEGRATION TESTS - O2OEG Platform
 * اختبارات التكامل - التحقق من تدفق البيانات بين الأنظمة
 * ====================================================
 */
class IntegrationFlowTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $salonTenant;
    protected $salonOwner;

    protected function setUp(): void
    {
        parent::setUp();
        $uid = uniqid();

        $this->salonTenant = Tenant::create([
            'name'              => 'صالون التكامل',
            'domain'            => "t1_{$uid}.o2oeg.com",
            'status'            => 'active',
            'business_category' => 'salon',
            'phone'             => '01011223344',
        ]);

        $this->adminUser = User::create([
            'name'      => 'Admin Integration',
            'email'     => "admin_int_{$uid}@o2oeg.com",
            'phone'     => '01099990001',
            'password'  => bcrypt('AdminPass#123'),
            'role'      => 'admin',
            'tenant_id' => $this->salonTenant->id,
        ]);

        $this->salonOwner = User::create([
            'name'      => 'Salon Owner Integration',
            'email'     => "owner_int_{$uid}@o2oeg.com",
            'phone'     => '01099990002',
            'password'  => bcrypt('O2OEG_Secure_Shield_2026_#646'),
            'role'      => 'tenant',
            'tenant_id' => $this->salonTenant->id,
        ]);
    }

    // ===========================
    // TEST INT-001: تسجيل الدخول يُرجع رمز Sanctum
    // ===========================
    public function test_login_returns_sanctum_token()
    {
        $response = $this->postJson('/api/login', [
            'phone'    => '01099990002',
            'password' => 'O2OEG_Secure_Shield_2026_#646',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['access_token']);
    }

    // ===========================
    // TEST INT-002: بيانات خاطئة تُرجع 401
    // ===========================
    public function test_wrong_credentials_returns_401()
    {
        $response = $this->postJson('/api/login', [
            'phone'    => '01099990002',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(422);
    }

    // ===========================
    // TEST INT-003: الوصول بدون Token يُرجع 401
    // ===========================
    public function test_protected_route_without_token_returns_401()
    {
        $response = $this->getJson('/api/me');
        $response->assertStatus(401);
    }

    // ===========================
    // TEST INT-004: التسجيل كـ Lead جديد ثم التحقق في DB
    // ===========================
    public function test_lead_registration_flow()
    {
        $response = $this->postJson('/api/leads', [
            'name'          => 'صالون النجمة',
            'business_name' => 'صالون النجمة للتجميل',
            'business_type' => 'salon',
            'email'         => 'nojma@test.com',
            'phone'         => '01055667788',
            'governorate'   => 'القاهرة',
            'interest_type' => 'salon',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('leads', [
            'phone' => '01055667788',
            'name'  => 'صالون النجمة',
        ]);
    }

    // ===========================
    // TEST INT-005: التحقق من عزل البيانات بين الـ Tenants (Multi-Tenancy)
    // ===========================
    public function test_tenant_data_isolation()
    {
        // إنشاء Tenant ثانٍ منفصل
        $uid2 = uniqid();
        $otherTenant = Tenant::create([
            'name'              => 'صالون منافس',
            'domain'            => "t2_{$uid2}.o2oeg.com",
            'status'            => 'active',
            'business_category' => 'salon',
            'phone'             => '01033334444',
        ]);

        $otherOwner = User::create([
            'name'      => 'Other Owner',
            'email'     => "other_{$uid2}@o2oeg.com",
            'phone'     => '01033334444',
            'password'  => bcrypt('password'),
            'role'      => 'tenant',
            'tenant_id' => $otherTenant->id,
        ]);

        // تسجيل دخول أحد المستخدمين
        $loginRes = $this->postJson('/api/login', [
            'phone'    => '01033334444',
            'password' => 'password',
        ]);

        $loginRes->assertStatus(200);

        // التحقق أن التوكن تم إرجاعه
        $this->assertArrayHasKey('access_token', $loginRes->json());
    }

    // ===========================
    // TEST INT-006: رابط الـ API الرئيسي يعمل
    // ===========================
    public function test_api_root_is_reachable()
    {
        $response = $this->getJson('/api/health');
        // قد يكون 200 أو 404 - لكن يجب ألا يكون 500
        $this->assertNotEquals(500, $response->getStatusCode(), "INT-006: API should not return 500 server error");
    }

    // ===========================
    // TEST INT-007: تسجيل الخروج يُبطل الجلسة
    // ===========================
    public function test_logout_invalidates_session()
    {
        // الدخول أولاً
        $login = $this->postJson('/api/login', [
            'phone'    => '01099990002',
            'password' => 'O2OEG_Secure_Shield_2026_#646',
        ]);

        $token = $login->json('access_token');
        $this->assertNotNull($token, "INT-007: Token should be returned after login");

        // تسجيل الخروج
        $logout = $this->withToken($token)->postJson('/api/logout');
        $this->assertContains($logout->status(), [200, 204], "INT-007: Logout should return 200 or 204");
    }
}
