<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = ['house_resident_id', 'type', 'amount', 'period_month', 'paid_at', 'notes'];

    protected $casts = [
        'amount' => 'decimal:2',
        'period_month' => 'date',
        'paid_at' => 'date',
    ];

    public function houseResident()
    {
        return $this->belongsTo(HouseResident::class);
    }
}
