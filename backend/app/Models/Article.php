<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Article extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'title',
        'slug',
        'content',
        'category',
        'image',
        'author',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($article) {
            if (empty($article->slug)) {
                $slug = Str::slug($article->title);
                if (empty($slug)) {
                    // Fallback for Arabic/Non-ASCII titles
                    $slug = 'article-' . Str::random(10);
                } else {
                    $slug .= '-' . Str::random(5);
                }
                $article->slug = $slug;
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}

