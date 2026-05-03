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
        if (!Schema::hasTable('crm_orders')) {
            Schema::create('crm_orders', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('tenant_id')->constrained()->onDelete('cascade');
                $table->foreignUuid('crm_client_id')->constrained('crm_clients')->onDelete('cascade');
                $table->decimal('total_amount', 12, 2);
                $table->enum('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])->default('pending');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('crm_order_items')) {
            Schema::create('crm_order_items', function (Blueprint $table) {
                $table->id();
                $table->foreignUuid('crm_order_id')->constrained('crm_orders')->onDelete('cascade');
                $table->foreignUuid('product_id')->constrained('products')->onDelete('cascade');
                $table->integer('quantity');
                $table->decimal('price_at_order', 12, 2);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_order_items');
        Schema::dropIfExists('crm_orders');
    }
};
