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
        Schema::create('content_posts', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id')->index();
            $table->foreignId('calendar_id')->constrained('content_calendars')->onDelete('cascade');
            $table->string('platform'); 
            $table->string('post_type'); 
            $table->string('title')->nullable();
            $table->text('content_text')->nullable();
            $table->string('hashtags')->nullable();
            $table->text('image_prompt')->nullable();
            $table->json('advice_json')->nullable();
            $table->dateTime('scheduled_at')->nullable();
            $table->string('status')->default('idea'); 
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_posts');
    }
};
