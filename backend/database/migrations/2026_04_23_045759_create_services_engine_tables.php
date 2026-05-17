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
        Schema::create('services', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'beta', 'disabled'])->default('active');
            $table->enum('target_audience', ['salon', 'company', 'affiliate']);
            $table->enum('pricing_type', ['subscription', 'addon', 'free'])->default('subscription');
            $table->decimal('price', 10, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('service_features', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('service_id')->index();
            $table->string('name');
            $table->string('feature_key')->unique();
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_features');
        Schema::dropIfExists('services');
    }
};
