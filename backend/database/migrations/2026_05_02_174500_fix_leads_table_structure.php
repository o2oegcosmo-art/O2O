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
        Schema::table('leads', function (Blueprint $table) {
            // جعل الإيميل اختيارياً إذا كان موجوداً
            if (Schema::hasColumn('leads', 'email')) {
                $table->string('email')->nullable()->change();
            }
            
            // إضافة عمود المحافظة إذا لم يكن موجوداً
            if (!Schema::hasColumn('leads', 'governorate')) {
                $table->string('governorate', 100)->nullable()->after('phone');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // لا حاجة للتراجع عن جعل الحقل nullable في الغالب
            if (Schema::hasColumn('leads', 'governorate')) {
                $table->dropColumn('governorate');
            }
        });
    }
};
