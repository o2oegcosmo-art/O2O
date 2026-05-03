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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('receipt_path')->nullable()->after('transaction_id');
            $table->text('admin_notes')->nullable()->after('receipt_path');
            $table->string('sender_phone')->nullable()->after('admin_notes'); // رقم المحفظة اللي حول منها
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['receipt_path', 'admin_notes', 'sender_phone']);
        });
    }
};
