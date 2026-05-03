<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmStylistCertification extends Model
{
    use HasFactory;

    protected $fillable = [
        'crm_stylist_id',
        'event_id',
        'certified_at'
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function stylist()
    {
        return $this->belongsTo(CrmStylist::class, 'crm_stylist_id');
    }
}
