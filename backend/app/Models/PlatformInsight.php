<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PlatformInsight extends Model
{
    use HasUuids;

    protected $fillable = [
        'type',
        'category',
        'insight_text',
        'significance_score',
        'data_points'
    ];

    protected $casts = [
        'data_points' => 'array',
        'significance_score' => 'float'
    ];
}

