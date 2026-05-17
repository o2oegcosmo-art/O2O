<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventAnalytic extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id', 'tenant_id', 'type', 'platform'
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}

