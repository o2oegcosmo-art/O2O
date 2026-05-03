<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('event_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('event_id')->references('id')->on('events')->onDelete('cascade');
            $table->foreignUuid('tenant_id')->nullable()->constrained('tenants')->onDelete('set null');
            $table->enum('type', ['impression', 'click']);
            $table->string('platform')->default('web');
            $table->timestamp('created_at')->useCurrent();
        });
    }
};