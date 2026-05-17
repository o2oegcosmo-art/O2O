<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * ====================================================
 * UNIT TESTS - O2OEG Platform
 * اختبارات الوحدات - فحص كل وحدة برمجية بشكل معزول
 * ====================================================
 */
class CommissionCalculatorTest extends TestCase
{
    // ===========================
    // دالة حساب العمولة
    // ===========================
    private function calculateCommission(float $servicePrice, float $commissionRate): float
    {
        if ($commissionRate < 0 || $commissionRate > 100) {
            throw new \InvalidArgumentException('Commission rate must be between 0 and 100');
        }
        return round($servicePrice * ($commissionRate / 100), 2);
    }

    // ===========================
    // دالة حساب الخصم
    // ===========================
    private function applyDiscount(float $originalPrice, float $discountPercent): float
    {
        if ($discountPercent < 0 || $discountPercent > 100) {
            throw new \InvalidArgumentException('Discount must be between 0 and 100');
        }
        return round($originalPrice - ($originalPrice * $discountPercent / 100), 2);
    }

    // ===========================
    // دالة التحقق من رقم الهاتف المصري
    // ===========================
    private function isValidEgyptianPhone(string $phone): bool
    {
        return (bool) preg_match('/^(010|011|012|015)\d{8}$/', $phone);
    }

    // ===========================
    // دالة حساب ضريبة القيمة المضافة
    // ===========================
    private function calculateVAT(float $price, float $vatRate = 14.0): float
    {
        return round($price * ($vatRate / 100), 2);
    }

    // ===========================
    // TEST UNIT-001: حساب عمولة الموظف 10%
    // ===========================
    public function test_commission_10_percent_is_correct()
    {
        $result = $this->calculateCommission(500.00, 10);
        $this->assertEquals(50.00, $result, "UNIT-001: 10% commission on 500 EGP should be 50 EGP");
    }

    // ===========================
    // TEST UNIT-002: حساب عمولة صفر
    // ===========================
    public function test_zero_commission_returns_zero()
    {
        $result = $this->calculateCommission(1000.00, 0);
        $this->assertEquals(0.00, $result, "UNIT-002: 0% commission should always return 0");
    }

    // ===========================
    // TEST UNIT-003: عمولة 100%
    // ===========================
    public function test_full_commission_returns_full_price()
    {
        $result = $this->calculateCommission(300.00, 100);
        $this->assertEquals(300.00, $result, "UNIT-003: 100% commission should equal the full service price");
    }

    // ===========================
    // TEST UNIT-004: نسبة عمولة غير صالحة
    // ===========================
    public function test_invalid_commission_throws_exception()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->calculateCommission(500.00, 150);
    }

    // ===========================
    // TEST UNIT-005: حساب خصم كوبون 50 جنيه
    // ===========================
    public function test_discount_applied_correctly()
    {
        $result = $this->applyDiscount(200.00, 25);
        $this->assertEquals(150.00, $result, "UNIT-005: 25% discount on 200 EGP should result in 150 EGP");
    }

    // ===========================
    // TEST UNIT-006: خصم 0% لا يغير السعر
    // ===========================
    public function test_zero_discount_returns_original_price()
    {
        $result = $this->applyDiscount(350.00, 0);
        $this->assertEquals(350.00, $result, "UNIT-006: Zero discount should not change the price");
    }

    // ===========================
    // TEST UNIT-007: خصم 100% يعطي صفر
    // ===========================
    public function test_full_discount_returns_zero()
    {
        $result = $this->applyDiscount(500.00, 100);
        $this->assertEquals(0.00, $result, "UNIT-007: 100% discount should make price zero");
    }

    // ===========================
    // TEST UNIT-008: رقم هاتف فودافون صالح
    // ===========================
    public function test_vodafone_phone_number_is_valid()
    {
        $this->assertTrue($this->isValidEgyptianPhone('01044167626'), "UNIT-008: Vodafone number starting with 010 should be valid");
    }

    // ===========================
    // TEST UNIT-009: رقم هاتف اتصالات صالح
    // ===========================
    public function test_etisalat_phone_number_is_valid()
    {
        $this->assertTrue($this->isValidEgyptianPhone('01199998888'), "UNIT-009: Etisalat number starting with 011 should be valid");
    }

    // ===========================
    // TEST UNIT-010: رقم هاتف دولي غير صالح
    // ===========================
    public function test_international_phone_number_is_invalid()
    {
        $this->assertFalse($this->isValidEgyptianPhone('+201044167626'), "UNIT-010: International format should fail Egyptian phone validation");
    }

    // ===========================
    // TEST UNIT-011: رقم هاتف ناقص غير صالح
    // ===========================
    public function test_short_phone_number_is_invalid()
    {
        $this->assertFalse($this->isValidEgyptianPhone('0101234'), "UNIT-011: Short phone numbers should fail validation");
    }

    // ===========================
    // TEST UNIT-012: حساب ضريبة القيمة المضافة 14%
    // ===========================
    public function test_vat_calculation_is_correct()
    {
        $vat = $this->calculateVAT(1000.00);
        $this->assertEquals(140.00, $vat, "UNIT-012: VAT at 14% on 1000 EGP should be 140 EGP");
    }

    // ===========================
    // TEST UNIT-013: حساب عمولة مع كسور عشرية
    // ===========================
    public function test_commission_rounds_correctly_for_decimal_prices()
    {
        $result = $this->calculateCommission(333.33, 10);
        $this->assertEquals(33.33, $result, "UNIT-013: Commission rounding should be precise to 2 decimal places");
    }
}
