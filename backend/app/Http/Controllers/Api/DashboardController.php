<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\House;
use App\Models\Payment;
use App\Models\Resident;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $now = Carbon::now();

        $totalHouses = House::count();
        $occupiedHouses = House::where('status', 'dihuni')->count();
        $vacantHouses = House::where('status', 'tidak_dihuni')->count();

        $totalResidents = Resident::count();
        $totalPermanent = Resident::where('status', 'tetap')->count();
        $totalContract = Resident::where('status', 'kontrak')->count();

        $incomeThisMonth = (float) Payment::whereYear('paid_at', $now->year)
            ->whereMonth('paid_at', $now->month)
            ->sum('amount');

        $expenseThisMonth = (float) Expense::whereYear('expense_date', $now->year)
            ->whereMonth('expense_date', $now->month)
            ->sum('amount');

        $recentPayments = Payment::with(['houseResident.resident', 'houseResident.house'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $recentExpenses = Expense::orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'total_houses' => $totalHouses,
                'occupied_houses' => $occupiedHouses,
                'vacant_houses' => $vacantHouses,
                'total_residents' => $totalResidents,
                'total_permanent' => $totalPermanent,
                'total_contract' => $totalContract,
                'income_this_month' => $incomeThisMonth,
                'expense_this_month' => $expenseThisMonth,
                'balance' => $incomeThisMonth - $expenseThisMonth,
                'recent_payments' => $recentPayments,
                'recent_expenses' => $recentExpenses,
            ],
        ]);
    }
}
