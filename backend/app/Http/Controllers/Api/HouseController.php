<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\HouseResident;
use App\Models\Payment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class HouseController extends Controller
{
    public function index(Request $request)
    {
        $query = House::with('currentResident.resident');

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $houses = $query->orderByRaw("CAST(SUBSTRING_INDEX(house_number, '-', -1) AS UNSIGNED) ASC")->get();

        return response()->json([
            'data' => $houses,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'house_number' => 'required|string|max:50|unique:houses,house_number',
            'description' => 'nullable|string',
            'resident_id' => 'nullable|exists:residents,id',
        ], [
            'house_number.required' => 'Nomor rumah wajib diisi.',
            'house_number.unique' => 'Nomor rumah ini sudah terdaftar di sistem. Silakan gunakan nomor lain.',
            'resident_id.exists' => 'Penghuni yang dipilih tidak ditemukan.'
        ]);

        $house = House::create($request->only('house_number', 'description'));

        if ($request->filled('resident_id')) {
            $this->deactivateResidentPreviousHouse($request->resident_id);
            
            HouseResident::create([
                'house_id' => $house->id,
                'resident_id' => $request->resident_id,
                'start_date' => Carbon::today(),
                'is_active' => true,
            ]);
            $house->update(['status' => 'dihuni']);
        }

        return response()->json([
            'data' => $house->fresh()->load('currentResident.resident'),
            'message' => 'House created successfully',
        ], 201);
    }

    public function show($id)
    {
        $house = House::with('currentResident.resident')
            ->findOrFail($id);

        return response()->json([
            'data' => $house,
        ]);
    }

    public function update(Request $request, $id)
    {
        $house = House::findOrFail($id);

        $validated = $request->validate([
            'house_number' => 'sometimes|required|string|max:50|unique:houses,house_number,' . $id,
            'description' => 'nullable|string',
            'resident_id' => 'nullable|exists:residents,id',
        ]);

        $house->update($request->only('house_number', 'description'));

        if ($request->has('resident_id')) {
            $currentActive = HouseResident::where('house_id', $id)->where('is_active', true)->first();
            
            if ($request->filled('resident_id')) {
                if (!$currentActive || $currentActive->resident_id != $request->resident_id) {
                    if ($currentActive) {
                        $currentActive->update(['is_active' => false, 'end_date' => Carbon::today()]);
                    }
                    
                    $this->deactivateResidentPreviousHouse($request->resident_id);

                    HouseResident::create([
                        'house_id' => $id,
                        'resident_id' => $request->resident_id,
                        'start_date' => Carbon::today(),
                        'is_active' => true,
                    ]);
                    $house->update(['status' => 'dihuni']);
                }
            } else {
                if ($currentActive) {
                    $currentActive->update(['is_active' => false, 'end_date' => Carbon::today()]);
                    $house->update(['status' => 'kosong']);
                }
            }
        }

        return response()->json([
            'data' => $house->fresh()->load('currentResident.resident'),
            'message' => 'House updated successfully',
        ]);
    }

    public function assignResident(Request $request, $id)
    {
        $house = House::findOrFail($id);

        $validated = $request->validate([
            'resident_id' => 'required|exists:residents,id',
            'start_date' => 'nullable|date',
        ]);

        // Deactivate any current resident for this house
        HouseResident::where('house_id', $id)
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'end_date' => Carbon::today(),
            ]);

        // Deactivate resident's previous house if any
        $this->deactivateResidentPreviousHouse($validated['resident_id']);

        // Create new assignment
        $houseResident = HouseResident::create([
            'house_id' => $id,
            'resident_id' => $validated['resident_id'],
            'start_date' => $validated['start_date'] ?? Carbon::today(),
            'is_active' => true,
        ]);

        // Update house status
        $house->update(['status' => 'dihuni']);

        return response()->json([
            'data' => $house->fresh()->load('currentResident.resident'),
            'message' => 'Resident assigned to house successfully',
        ]);
    }

    public function removeResident($id, $residentId)
    {
        $house = House::findOrFail($id);

        $houseResident = HouseResident::where('house_id', $id)
            ->where('resident_id', $residentId)
            ->where('is_active', true)
            ->firstOrFail();

        $houseResident->update([
            'is_active' => false,
            'end_date' => Carbon::today(),
        ]);

        // Check if house has any other active residents
        $hasOtherActive = HouseResident::where('house_id', $id)
            ->where('is_active', true)
            ->exists();

        if (!$hasOtherActive) {
            $house->update(['status' => 'tidak_dihuni']);
        }

        return response()->json([
            'data' => $house->fresh()->load('currentResident.resident'),
            'message' => 'Resident removed from house successfully',
        ]);
    }

    public function history($id)
    {
        $house = House::findOrFail($id);

        $history = HouseResident::with('resident')
            ->where('house_id', $id)
            ->orderBy('start_date', 'desc')
            ->get();

        return response()->json([
            'data' => $history,
        ]);
    }

    public function paymentHistory($id)
    {
        $house = House::findOrFail($id);

        $houseResidentIds = HouseResident::where('house_id', $id)->pluck('id');

        $payments = Payment::with('houseResident.resident')
            ->whereIn('house_resident_id', $houseResidentIds)
            ->orderBy('paid_at', 'desc')
            ->get();

        return response()->json([
            'data' => $payments,
        ]);
    }

    private function deactivateResidentPreviousHouse($residentId)
    {
        $previousActive = \App\Models\HouseResident::where('resident_id', $residentId)
            ->where('is_active', true)
            ->first();

        if ($previousActive) {
            $previousActive->update([
                'is_active' => false,
                'end_date' => \Carbon\Carbon::today(),
            ]);
            
            $previousHouse = \App\Models\House::find($previousActive->house_id);
            if ($previousHouse) {
                $stillOccupied = \App\Models\HouseResident::where('house_id', $previousHouse->id)->where('is_active', true)->exists();
                if (!$stillOccupied) {
                    $previousHouse->update(['status' => 'tidak_dihuni']);
                }
            }
        }
    }
}
