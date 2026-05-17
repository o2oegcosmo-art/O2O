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
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // نستخدم حلاً جذرياً: حذف العمود القديم وإنشاء عمود متوافق مع UUID
            $table->dropColumn(['tokenable_id', 'tokenable_type']);
        });

        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->uuidMorphs('tokenable');
            // نعيد ترتيب العمود ليكون بعد المعرف الأساسي (اختياري للتنظيم)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropColumn(['tokenable_id', 'tokenable_type']);
        });
        
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->morphs('tokenable');
        });
    }
};
