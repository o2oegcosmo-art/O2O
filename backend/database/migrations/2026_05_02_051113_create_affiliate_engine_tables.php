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
        Schema::create('affiliate_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->index();
            $table->string('promo_code')->unique();
            $table->decimal('commission_percentage', 5, 2)->default(10.00); // 10%
            $table->decimal('balance', 10, 2)->default(0.00);
            $table->decimal('total_earned', 10, 2)->default(0.00);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('affiliate_clicks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('affiliate_profile_id')->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->foreign('affiliate_profile_id')->references('id')->on('affiliate_profiles')->onDelete('cascade');
        });

        Schema::create('affiliate_commissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('affiliate_profile_id')->index();
            $table->uuid('tenant_id')->index(); // The referred tenant
            $table->uuid('subscription_id')->nullable()->index(); // The subscription that triggered this
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['pending', 'approved', 'paid', 'rejected'])->default('pending');
            $table->timestamps();

            $table->foreign('affiliate_profile_id')->references('id')->on('affiliate_profiles')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->uuid('referred_by')->nullable()->index()->after('status');
            $table->foreign('referred_by')->references('id')->on('affiliate_profiles')->onDelete('set null');
        });
        
        // Add affiliate to role enum if possible (MySQL specific)
        \DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'owner', 'staff', 'affiliate') DEFAULT 'staff'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert enum change (best effort)
        \DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'owner', 'staff') DEFAULT 'staff'");
        
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['referred_by']);
            $table->dropColumn('referred_by');
        });

        Schema::dropIfExists('affiliate_commissions');
        Schema::dropIfExists('affiliate_clicks');
        Schema::dropIfExists('affiliate_profiles');
    }
};
