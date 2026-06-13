<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Payment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function summary(Request $request)
    {
        $year = $request->get('year', Carbon::now()->year);

        $months = [];

        for ($month = 1; $month <= 12; $month++) {
            $totalIncome = Payment::whereYear('paid_at', $year)
                ->whereMonth('paid_at', $month)
                ->sum('amount');

            $totalExpense = Expense::whereYear('expense_date', $year)
                ->whereMonth('expense_date', $month)
                ->sum('amount');

            $months[] = [
                'month' => $month,
                'month_name' => Carbon::create($year, $month, 1)->translatedFormat('F'),
                'total_income' => (float) $totalIncome,
                'total_expense' => (float) $totalExpense,
                'balance' => (float) ($totalIncome - $totalExpense),
            ];
        }

        return response()->json([
            'data' => $months,
            'meta' => [
                'year' => (int) $year,
                'total_income' => collect($months)->sum('total_income'),
                'total_expense' => collect($months)->sum('total_expense'),
                'total_balance' => collect($months)->sum('balance'),
            ],
        ]);
    }

    public function monthly($year, $month)
    {
        // Get all payments for this month
        $payments = Payment::with(['houseResident.resident', 'houseResident.house'])
            ->whereYear('paid_at', $year)
            ->whereMonth('paid_at', $month)
            ->orderBy('paid_at', 'desc')
            ->get();

        $kebersihanPayments = $payments->where('type', 'kebersihan');
        $satpamPayments = $payments->where('type', 'satpam');

        // Get all expenses for this month
        $expenses = Expense::whereYear('expense_date', $year)
            ->whereMonth('expense_date', $month)
            ->orderBy('expense_date', 'desc')
            ->get();

        $totalIncome = $payments->sum('amount');
        $totalExpense = $expenses->sum('amount');

        return response()->json([
            'data' => [
                'payments' => [
                    'kebersihan' => [
                        'items' => $kebersihanPayments->values(),
                        'subtotal' => (float) $kebersihanPayments->sum('amount'),
                        'count' => $kebersihanPayments->count(),
                    ],
                    'satpam' => [
                        'items' => $satpamPayments->values(),
                        'subtotal' => (float) $satpamPayments->sum('amount'),
                        'count' => $satpamPayments->count(),
                    ],
                ],
                'expenses' => $expenses,
                'total_income' => (float) $totalIncome,
                'total_expense' => (float) $totalExpense,
                'balance' => (float) ($totalIncome - $totalExpense),
            ],
            'meta' => [
                'year' => (int) $year,
                'month' => (int) $month,
                'month_name' => Carbon::create($year, $month, 1)->translatedFormat('F Y'),
            ],
        ]);
    }
}
