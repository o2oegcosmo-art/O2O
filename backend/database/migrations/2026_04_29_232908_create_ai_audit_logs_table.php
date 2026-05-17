<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id')->nullable();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->string('feature'); // e.g., 'whatsapp_receptionist', 'content_studio'
            $table->string('model')->nullable();
            $table->text('prompt_sent');
            $table->text('response_received')->nullable();
            $table->boolean('is_hallucination')->default(false);
            $table->json('security_flags')->nullable(); // For injection detection
            $table->integer('tokens_estimated')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_audit_logs');
    }
};
