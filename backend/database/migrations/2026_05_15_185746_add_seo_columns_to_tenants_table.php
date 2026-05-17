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
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'description')) {
                $table->text('description')->nullable();
            }
            if (!Schema::hasColumn('tenants', 'og_image_url')) {
                $table->string('og_image_url')->nullable();
            }
            if (!Schema::hasColumn('tenants', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable();
            }
            if (!Schema::hasColumn('tenants', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['description', 'og_image_url', 'latitude', 'longitude']);
        });
    }
};
