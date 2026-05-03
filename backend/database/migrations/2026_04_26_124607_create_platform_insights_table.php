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
        Schema::create('platform_insights', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type'); // trend, success_pattern, warning
            $table->string('category'); // sales, booking, loyalty
            $table->text('insight_text'); // e.g., "Mondays at 10 AM have 30% more cancelations in Alexandria"
            $table->decimal('significance_score', 3, 2)->default(1.00); // 0 to 5
            $table->json('data_points')->nullable(); // Anonymized data behind the insight
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_insights');
    }
};
