<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::query();

        if ($request->has('start_month') && $request->start_month) {
            $start = $request->start_month . '-01';
            $query->whereDate('expense_date', '>=', $start);

            if (!$request->has('end_month') || empty($request->end_month)) {
                $end = date('Y-m-t', strtotime($start));
                $query->whereDate('expense_date', '<=', $end);
            }
        }

        if ($request->has('end_month') && $request->end_month) {
            $end = date('Y-m-t', strtotime($request->end_month . '-01'));
            $query->whereDate('expense_date', '<=', $end);
        }

        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        $expenses = $query->orderBy('expense_date', 'desc')->get();

        return response()->json([
            'data' => $expenses,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'category' => 'required|in:gaji_satpam,listrik_pos,perbaikan_jalan,perbaikan_selokan,lainnya',
            'is_recurring' => 'boolean',
        ]);

        $exists = Expense::where('title', $validated['title'])
            ->where('category', $validated['category'])
            ->whereDate('expense_date', $validated['expense_date'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Pengeluaran dengan Judul, Kategori, dan Tanggal yang sama persis sudah tercatat.',
            ], 422);
        }

        $expense = Expense::create($validated);

        return response()->json([
            'data' => $expense,
            'message' => 'Expense created successfully',
        ], 201);
    }

    public function show($id)
    {
        $expense = Expense::findOrFail($id);

        return response()->json([
            'data' => $expense,
        ]);
    }

    public function update(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'sometimes|required|numeric|min:0',
            'expense_date' => 'sometimes|required|date',
            'category' => 'sometimes|required|in:gaji_satpam,listrik_pos,perbaikan_jalan,perbaikan_selokan,lainnya',
            'is_recurring' => 'boolean',
        ]);

        $title = $validated['title'] ?? $expense->title;
        $category = $validated['category'] ?? $expense->category;
        $expenseDate = $validated['expense_date'] ?? $expense->expense_date;

        $exists = Expense::where('title', $title)
            ->where('category', $category)
            ->whereDate('expense_date', $expenseDate)
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Pengeluaran dengan Judul, Kategori, dan Tanggal yang sama persis sudah tercatat.',
            ], 422);
        }

        $expense->update($validated);

        return response()->json([
            'data' => $expense->fresh(),
            'message' => 'Expense updated successfully',
        ]);
    }

    public function destroy($id)
    {
        $expense = Expense::findOrFail($id);
        $expense->delete();

        return response()->json([
            'message' => 'Expense deleted successfully',
        ]);
    }
}
