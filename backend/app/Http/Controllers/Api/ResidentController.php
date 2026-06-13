<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ResidentController extends Controller
{
    public function index(Request $request)
    {
        $query = Resident::with('currentHouse.house');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $residents = $query->orderBy('name')->get();

        return response()->json([
            'data' => $residents,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'status' => 'required|in:tetap,kontrak',
            'is_married' => 'boolean',
        ], [
            'name.required' => 'Nama wajib diisi.'
        ]);

        $resident = Resident::create($validated);

        return response()->json([
            'data' => $resident,
            'message' => 'Resident created successfully',
        ], 201);
    }

    public function show($id)
    {
        $resident = Resident::with(['houseResidents.house', 'houseResidents.payments', 'currentHouse.house'])
            ->findOrFail($id);

        return response()->json([
            'data' => $resident,
        ]);
    }

    public function update(Request $request, $id)
    {
        $resident = Resident::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'status' => 'sometimes|required|in:tetap,kontrak',
            'is_married' => 'boolean',
        ], [
            'name.required' => 'Nama wajib diisi.'
        ]);

        $resident->update($validated);

        return response()->json([
            'data' => $resident->fresh(),
            'message' => 'Resident updated successfully',
        ]);
    }

    public function uploadPhoto(Request $request, $id)
    {
        $resident = Resident::findOrFail($id);

        $request->validate([
            'photo' => 'required|image|max:2048',
        ]);

        // Delete old photo if exists
        if ($resident->ktp_photo) {
            Storage::disk('public')->delete($resident->ktp_photo);
        }

        $path = $request->file('photo')->store('ktp_photos', 'public');

        $resident->update(['ktp_photo' => $path]);

        return response()->json([
            'data' => $resident->fresh(),
            'message' => 'KTP photo uploaded successfully',
        ]);
    }

    public function deletePhoto($id)
    {
        $resident = Resident::findOrFail($id);

        if ($resident->ktp_photo) {
            Storage::disk('public')->delete($resident->ktp_photo);
            $resident->update(['ktp_photo' => null]);
        }

        return response()->json(['message' => 'KTP photo deleted successfully']);
    }

    public function viewPhoto($id)
    {
        $resident = Resident::findOrFail($id);

        if (!$resident->ktp_photo) {
            abort(404, 'No photo found');
        }

        $path = storage_path('app/private/' . $resident->ktp_photo);

        if (!file_exists($path)) {
            abort(404, 'Photo file not found');
        }

        return response()->file($path);
    }
}
