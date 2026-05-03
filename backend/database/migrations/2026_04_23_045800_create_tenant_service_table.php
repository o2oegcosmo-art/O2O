<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_service', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignUuid('tenant_id')->constrained()->onDelete('cascade');
            $blueprint->foreignUuid('service_id')->constrained()->onDelete('cascade');
            $blueprint->string('status')->default('active'); // active, trialing, expired
            $blueprint->timestamp('activated_at')->nullable();
            $blueprint->timestamp('expires_at')->nullable();
            $blueprint->json('settings')->nullable(); // لتخزين تفعيل/تعطيل ميزات معينة داخل الخدمة
            $blueprint->timestamps();
        });
    }
};