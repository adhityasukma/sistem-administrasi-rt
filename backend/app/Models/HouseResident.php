<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HouseResident extends Model
{
    protected $fillable = ['house_id', 'resident_id', 'start_date', 'end_date', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function house()
    {
        return $this->belongsTo(House::class);
    }

    public function resident()
    {
        return $this->belongsTo(Resident::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
