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
            if (!Schema::hasColumn('tenants', 'specialty')) {
                $table->string('specialty')->nullable()->after('business_category');
            }
            if (!Schema::hasColumn('tenants', 'business_reg')) {
                $table->string('business_reg')->nullable()->after('specialty');
            }
        });

        Schema::table('affiliate_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('affiliate_profiles', 'payout_method')) {
                $table->string('payout_method')->nullable()->after('status');
            }
            if (!Schema::hasColumn('affiliate_profiles', 'payout_details')) {
                $table->text('payout_details')->nullable()->after('payout_method');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['specialty', 'business_reg']);
        });

        Schema::table('affiliate_profiles', function (Blueprint $table) {
            $table->dropColumn(['payout_method', 'payout_details']);
        });
    }
};
