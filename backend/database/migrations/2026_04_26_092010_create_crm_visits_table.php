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
        Schema::create('crm_visits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->foreignUuid('crm_client_id')->constrained('crm_clients')->onDelete('cascade');
            $table->dateTime('visited_at');
            $table->text('notes')->nullable();
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
            $table->string('outcome')->nullable(); // e.g. "Order Placed", "Follow up required", "No interest"
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_visits');
    }
};
