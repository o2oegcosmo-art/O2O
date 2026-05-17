<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('password_reset_tokens', function (Blueprint $table) {
            // Drop the primary key on email if it exists to allow phone or email resets
            $table->dropPrimary(['email']);
            $table->string('email')->nullable()->change();
            $table->string('phone')->nullable()->after('email')->index();
        });
    }

    public function down(): void
    {
        Schema::table('password_reset_tokens', function (Blueprint $table) {
            $table->dropIndex(['phone']);
            $table->dropColumn('phone');
            $table->string('email')->primary()->change();
        });
    }
};
