<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ⚡ PERF-001: Adding indexes for high-frequency multi-tenant queries
        
        Schema::table('bookings', function (Blueprint $table) {
            $table->index(['tenant_id', 'appointment_at']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->index(['tenant_id', 'phone']);
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::table('services', function (Blueprint $table) {
            $table->index(['tenant_id', 'status']);
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->index(['tenant_id', 'sku']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->index(['tenant_id', 'sender_phone']);
            $table->index(['tenant_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'appointment_at']);
            $table->dropIndex(['tenant_id', 'status']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'phone']);
            $table->dropIndex(['tenant_id', 'created_at']);
        });

        // ... drop other indexes if needed
    }
};
