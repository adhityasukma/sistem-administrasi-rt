<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('house_resident_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['kebersihan', 'satpam']);
            $table->decimal('amount', 12, 2);
            $table->date('period_month');
            $table->date('paid_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
