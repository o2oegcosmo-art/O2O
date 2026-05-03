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
        Schema::create('notifications', function (Blueprint $table) {
            // Using UUID for multi-tenant compatibility (matches other tables)
            $table->uuid('id')->primary();
            
            // Notifiable (morph) - who receives the notification
            $table->string('notifiable_type');
            $table->unsignedBigInteger('notifiable_id');
            
            // Notification type (class name)
            $table->string('type');
            
            // Payload data
            $table->json('data');
            
            // Timestamps
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            // Tenant ID for isolation
            $table->uuid('tenant_id')->index();
            
            // Indexes for performance
            $table->index(['notifiable_type', 'notifiable_id']);
            $table->index('created_at');
            
            // Foreign key to tenants (optional, for data integrity)
            $table->foreign('tenant_id')
                  ->references('id')
                  ->on('tenants')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
