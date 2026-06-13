<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\HouseResident;
use App\Models\Payment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['houseResident.resident', 'houseResident.house']);

        if ($request->has('year') && $request->year) {
            $query->whereYear('period_month', $request->year);
        }

        if ($request->has('month') && $request->month) {
            $query->whereMonth('period_month', $request->month);
        }

        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        if ($request->has('house_id') && $request->house_id) {
            $houseResidentIds = HouseResident::where('house_id', $request->house_id)->pluck('id');
            $query->whereIn('house_resident_id', $houseResidentIds);
        }

        $payments = $query->orderBy('paid_at', 'desc')->get();

        return response()->json([
            'data' => $payments,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'house_resident_id' => 'required|exists:house_residents,id',
            'type' => 'required|in:kebersihan,satpam',
            'amount' => 'nullable|numeric|min:0',
            'period_month' => 'required|date',
            'period_month_end' => 'nullable|date|after_or_equal:period_month',
            'paid_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ], [
            'period_month.required' => 'Bulan mulai wajib diisi.',
            'period_month.date' => 'Bulan mulai tidak valid.',
            'period_month_end.date' => 'Sampai bulan tidak valid.',
            'period_month_end.after_or_equal' => 'Sampai bulan tidak boleh lebih awal dari bulan mulai.'
        ]);

        // Auto-fill amount based on type if not provided
        if (empty($validated['amount'])) {
            $validated['amount'] = $validated['type'] === 'kebersihan' ? 15000 : 100000;
        }

        $paidAt = $validated['paid_at'] ?? Carbon::today()->toDateString();

        $monthsToInsert = [];
        $existingMonths = [];

        if (!empty($validated['period_month_end'])) {
            $startDate = Carbon::parse($validated['period_month'])->startOfMonth();
            $endDate = Carbon::parse($validated['period_month_end'])->startOfMonth();

            if ($endDate->lt($startDate)) {
                return response()->json(['message' => 'Bulan sampai tidak boleh lebih awal dari bulan mulai'], 422);
            }
            if ($endDate->equalTo($startDate)) {
                return response()->json(['message' => 'Jika hanya membayar 1 bulan, biarkan "Sampai Bulan" kosong'], 422);
            }

            $current = $startDate->copy();
            while ($current->lte($endDate)) {
                $monthsToInsert[] = $current->copy();
                $current->addMonth();
            }
        } else {
            $monthsToInsert[] = Carbon::parse($validated['period_month'])->startOfMonth();
        }

        // Check for duplicates
        foreach ($monthsToInsert as $date) {
            $exists = Payment::where('house_resident_id', $validated['house_resident_id'])
                ->where('type', $validated['type'])
                ->where('period_month', $date->toDateString())
                ->exists();

            if ($exists) {
                $monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                $monthName = $monthNames[$date->month - 1];
                $existingMonths[] = $monthName . ' ' . $date->year;
            }
        }

        if (count($existingMonths) > 0) {
            $typeLabel = $validated['type'] === 'kebersihan' ? 'Iuran Kebersihan' : 'Iuran Satpam';
            $monthList = implode(', ', $existingMonths);
            return response()->json([
                'message' => "Gagal! $typeLabel untuk periode berikut sudah lunas: $monthList. Silakan kecualikan bulan-bulan tersebut."
            ], 422);
        }

        $payments = [];
        foreach ($monthsToInsert as $date) {
            $payments[] = Payment::create([
                'house_resident_id' => $validated['house_resident_id'],
                'type' => $validated['type'],
                'amount' => $validated['amount'],
                'period_month' => $date->toDateString(),
                'paid_at' => $paidAt,
                'notes' => $validated['notes'] ?? null,
            ]);
        }

        $result = count($payments) === 1 ? $payments[0] : $payments;

        return response()->json([
            'data' => $result,
            'message' => count($payments) . ' payment(s) created successfully',
        ], 201);
    }

    public function status(Request $request)
    {
        $startYear = $request->query('start_year', date('Y'));
        $startMonth = $request->query('start_month', date('n'));
        $endYear = $request->query('end_year');
        $endMonth = $request->query('end_month');

        $startDate = Carbon::create($startYear, $startMonth, 1)->startOfMonth();
        $endDate = ($endYear && $endMonth) ? Carbon::create($endYear, $endMonth, 1)->startOfMonth() : $startDate->copy();

        if ($endDate->lt($startDate)) {
            $endDate = $startDate->copy();
        }

        // Get all occupied houses with active residents
        $houses = House::with(['currentResident.resident'])
            ->where('status', 'dihuni')
            ->whereHas('currentResident')
            ->orderByRaw("CAST(SUBSTRING_INDEX(house_number, '-', -1) AS UNSIGNED) ASC")
            ->get();

        $statusList = [];

        $currentDate = $startDate->copy();
        while ($currentDate->lte($endDate)) {
            $year = $currentDate->year;
            $month = $currentDate->month;

        foreach ($houses as $house) {
            $houseResident = $house->currentResident;

            if (!$houseResident) {
                continue;
            }

            // Fetch kebersihan payment
            $kebersihanPayment = Payment::where('house_resident_id', $houseResident->id)
                ->where('type', 'kebersihan')
                ->whereYear('period_month', $year)
                ->whereMonth('period_month', $month)
                ->first();

            $kebersihanPeriodEnd = $kebersihanPayment ? $kebersihanPayment->period_month : null;

            // Fetch satpam payment
            $satpamPayment = Payment::where('house_resident_id', $houseResident->id)
                ->where('type', 'satpam')
                ->whereYear('period_month', $year)
                ->whereMonth('period_month', $month)
                ->first();

            $satpamPeriodEnd = $satpamPayment ? $satpamPayment->period_month : null;

            $statusList[] = [
                'status_year' => $year,
                'status_month' => $month,
                'house_id' => $house->id,
                'house_number' => $house->house_number,
                'resident_name' => $houseResident->resident->name ?? '-',
                'resident_id' => $houseResident->resident->id ?? null,
                'house_resident_id' => $houseResident->id,
                'kebersihan_paid' => $kebersihanPayment !== null,
                'kebersihan_payment_id' => $kebersihanPayment ? $kebersihanPayment->id : null,
                'kebersihan_amount' => $kebersihanPayment ? $kebersihanPayment->amount : 15000,
                'kebersihan_notes' => $kebersihanPayment ? $kebersihanPayment->notes : null,
                'kebersihan_period_start' => $kebersihanPayment ? $kebersihanPayment->period_month : null,
                'kebersihan_period_end' => $kebersihanPeriodEnd,
                'satpam_paid' => $satpamPayment !== null,
                'satpam_payment_id' => $satpamPayment ? $satpamPayment->id : null,
                'satpam_amount' => $satpamPayment ? $satpamPayment->amount : 100000,
                'satpam_notes' => $satpamPayment ? $satpamPayment->notes : null,
                'satpam_period_start' => $satpamPayment ? $satpamPayment->period_month : null,
                'satpam_period_end' => $satpamPeriodEnd,
            ];
        }
            $currentDate->addMonth();
        }

        return response()->json([
            'data' => $statusList,
            'meta' => [
                'start_year' => (int) $startYear,
                'start_month' => (int) $startMonth,
                'end_year' => $endYear ? (int) $endYear : null,
                'end_month' => $endMonth ? (int) $endMonth : null,
            ],
        ]);
    }

    public function show($id)
    {
        $payment = Payment::with('houseResident.resident')->findOrFail($id);
        return response()->json(['data' => $payment]);
    }

    public function update(Request $request, $id)
    {
        $payment = Payment::findOrFail($id);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $payment->update($validated);

        return response()->json([
            'data' => $payment,
            'message' => 'Payment updated successfully',
        ]);
    }

    public function destroy($id)
    {
        $payment = Payment::findOrFail($id);
        
        // Auto-delete any duplicates for the exact same period and type
        Payment::where('house_resident_id', $payment->house_resident_id)
            ->where('type', $payment->type)
            ->where('period_month', $payment->period_month)
            ->delete();

        return response()->json([
            'message' => 'Payment deleted successfully',
        ]);
    }
}
