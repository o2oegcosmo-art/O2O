<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. صالونات التجميل المسجلة كعملاء للشركة (CRM Clients)
        if (!Schema::hasTable('crm_clients')) {
            Schema::create('crm_clients', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('tenant_id')->constrained()->onDelete('cascade');
                $table->string('salon_name');
                $table->string('owner_name')->nullable();
                $table->string('phone');
                $table->string('city');
                $table->enum('size', ['small', 'medium', 'large'])->default('small');
                $table->enum('tier', ['vip', 'regular', 'lead'])->default('lead');
                $table->decimal('monthly_spend', 12, 2)->default(0);
                $table->date('last_visit_at')->nullable();
                $table->timestamps();
            });
        }

        // 2. خط أنابيب المبيعات (Sales Pipeline / Opportunities)
        if (!Schema::hasTable('crm_opportunities')) {
            Schema::create('crm_opportunities', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('tenant_id')->constrained()->onDelete('cascade');
                $table->foreignUuid('crm_client_id')->constrained('crm_clients')->onDelete('cascade');
                $table->string('title');
                $table->decimal('estimated_value', 12, 2)->nullable();
                $table->enum('stage', ['new_lead', 'contacted', 'proposal', 'negotiation', 'won', 'lost'])->default('new_lead');
                $table->foreignId('assigned_rep_id')->nullable()->constrained('staff')->onDelete('set null');
                $table->timestamps();
            });
        }

        // 3. كتالوج المنتجات (B2B Catalog)
        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('tenant_id')->constrained()->onDelete('cascade');
                $table->string('name');
                $table->text('description')->nullable();
                $table->decimal('wholesale_price', 12, 2);
                $table->integer('stock_quantity')->default(0);
                $table->string('image_url')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('crm_opportunities');
        Schema::dropIfExists('crm_clients');
    }
};