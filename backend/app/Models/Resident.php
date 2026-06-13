<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resident extends Model
{
    protected $fillable = ['name', 'phone', 'ktp_photo', 'status', 'is_married'];

    protected $casts = [
        'is_married' => 'boolean',
    ];

    public function houseResidents()
    {
        return $this->hasMany(HouseResident::class);
    }

    public function currentHouse()
    {
        return $this->hasOne(HouseResident::class)->where('is_active', true);
    }
}
