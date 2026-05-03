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
            $table->text('google_ai_api_key')->nullable()->after('settings');
            $table->text('whatsapp_access_token')->nullable()->after('google_ai_api_key');
            $table->string('whatsapp_phone_number_id')->nullable()->after('whatsapp_access_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['google_ai_api_key', 'whatsapp_access_token', 'whatsapp_phone_number_id']);
        });
    }
};
