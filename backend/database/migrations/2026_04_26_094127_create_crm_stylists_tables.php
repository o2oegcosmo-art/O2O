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
        // 1. المصففين (الخبراء) العاملين في الصالونات
        Schema::create('crm_stylists', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('crm_client_id')->constrained('crm_clients')->onDelete('cascade');
            $table->string('name');
            $table->string('specialization')->nullable(); // هير دريسر، خبير صبغة، إلخ
            $table->string('phone')->nullable();
            $table->timestamps();
        });

        // 2. الشهادات والتدريبات التي حصل عليها المصفف
        Schema::create('crm_stylist_certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('crm_stylist_id')->constrained('crm_stylists')->onDelete('cascade');
            $table->uuid('event_id'); // الفعالية التدريبية
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            $table->date('certified_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_stylist_certifications');
        Schema::dropIfExists('crm_stylists');
    }
};
