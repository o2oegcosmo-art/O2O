<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WillAiLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'prompt',
        'response',
        'feedback',
        'user_comment'
    ];

    protected $casts = [
        'response' => 'json'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
