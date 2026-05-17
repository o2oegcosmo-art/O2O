<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * ⚡ Enterprise Performance Hardening
     */
    public function up(): void
    {
        // 1. Bookings - Critical for Calendar & Overview
        Schema::table('bookings', function (Blueprint $table) {
            $table->index(['tenant_id', 'appointment_at'], 'idx_tenant_appointment');
            $table->index(['tenant_id', 'status'], 'idx_tenant_booking_status');
        });

        // 2. Customers - Critical for Search & CRM
        Schema::table('customers', function (Blueprint $table) {
            $table->index(['tenant_id', 'phone'], 'idx_tenant_customer_phone');
            $table->index(['tenant_id', 'created_at'], 'idx_tenant_customer_date');
        });

        // 3. Inventory - Critical for Stock Management
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->index(['tenant_id', 'sku'], 'idx_tenant_inventory_sku');
        });

        // 4. Finance & Commissions - Critical for Accounting
        Schema::table('staff_commissions', function (Blueprint $table) {
            $table->index(['tenant_id', 'staff_id', 'status'], 'idx_tenant_staff_commission');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->index(['tenant_id', 'expense_date'], 'idx_tenant_expense_date');
        });

        // 5. Retail Orders - Critical for E-commerce
        Schema::table('retail_orders', function (Blueprint $table) {
            $table->index(['tenant_id', 'status', 'created_at'], 'idx_tenant_order_flow');
        });

        // 6. Messaging & AI Logs - High volume tables
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['tenant_id', 'created_at'], 'idx_tenant_msg_date');
        });

        Schema::table('will_ai_logs', function (Blueprint $table) {
            $table->index(['tenant_id', 'created_at'], 'idx_tenant_ai_log_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) { $table->dropIndex('idx_tenant_appointment'); $table->dropIndex('idx_tenant_booking_status'); });
        Schema::table('customers', function (Blueprint $table) { $table->dropIndex('idx_tenant_customer_phone'); $table->dropIndex('idx_tenant_customer_date'); });
        Schema::table('inventory_items', function (Blueprint $table) { $table->dropIndex('idx_tenant_inventory_sku'); });
        Schema::table('staff_commissions', function (Blueprint $table) { $table->dropIndex('idx_tenant_staff_commission'); });
        Schema::table('expenses', function (Blueprint $table) { $table->dropIndex('idx_tenant_expense_date'); });
        Schema::table('retail_orders', function (Blueprint $table) { $table->dropIndex('idx_tenant_order_flow'); });
        Schema::table('messages', function (Blueprint $table) { $table->dropIndex('idx_tenant_msg_date'); });
        Schema::table('will_ai_logs', function (Blueprint $table) { $table->dropIndex('idx_tenant_ai_log_date'); });
    }
};
