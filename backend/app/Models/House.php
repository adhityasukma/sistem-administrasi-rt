<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class House extends Model
{
    protected $fillable = ['house_number', 'status', 'description'];

    public function houseResidents()
    {
        return $this->hasMany(HouseResident::class);
    }

    public function currentResident()
    {
        return $this->hasOne(HouseResident::class)->where('is_active', true);
    }

    public function residents()
    {
        return $this->belongsToMany(Resident::class, 'house_residents')
            ->withPivot('start_date', 'end_date', 'is_active')
            ->withTimestamps();
    }
}
