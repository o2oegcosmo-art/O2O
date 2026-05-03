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
        Schema::create('knowledge_bases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->nullable()->constrained()->onDelete('cascade'); // Null = Platform Wide
            $table->string('title');
            $table->string('category')->default('general'); // products, guidelines, legal, sales
            $table->longText('content'); // The extracted text from PDF/Doc
            $table->string('file_path')->nullable(); // Path to original file
            $table->json('metadata')->nullable(); // Any extra info
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_bases');
    }
};
