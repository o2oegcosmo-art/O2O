<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->string('image_url');
            $table->enum('type', ['training', 'event', 'masterclass']);
            $table->boolean('is_promoted')->default(false);
            $table->integer('priority_weight')->default(1); 
            $table->json('target_roles')->nullable(); // ['salon', 'marketer']
            $table->string('target_business_type')->nullable(); // 'women_salon', 'barber'
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->timestamps();
        });
    }
};