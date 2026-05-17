<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('phone_hash')->nullable()->index()->after('phone');
        });

        Schema::table('crm_clients', function (Blueprint $table) {
            $table->string('phone_hash')->nullable()->index()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('phone_hash');
        });

        Schema::table('crm_clients', function (Blueprint $table) {
            $table->dropColumn('phone_hash');
        });
    }
};
