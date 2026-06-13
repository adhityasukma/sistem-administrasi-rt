<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = ['title', 'description', 'amount', 'expense_date', 'category', 'is_recurring'];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date',
        'is_recurring' => 'boolean',
    ];
}
