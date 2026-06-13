<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\House;
use App\Models\HouseResident;
use App\Models\Payment;
use App\Models\Resident;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create admin user
        User::create([
            'name' => 'Admin RT',
            'email' => 'admin@rt.com',
            'password' => Hash::make('password'),
        ]);

        // 2. Create 20 houses (Blok A-1 through Blok A-20)
        $houses = [];
        for ($i = 1; $i <= 20; $i++) {
            $houses[] = House::create([
                'house_number' => 'Blok A-' . $i,
                'status' => 'tidak_dihuni',
                'description' => null,
            ]);
        }

        // 3. Create 15 'tetap' residents
        $tetapNames = [
            ['name' => 'Budi Santoso', 'phone' => '081234567001', 'is_married' => true],
            ['name' => 'Siti Rahayu', 'phone' => '081234567002', 'is_married' => true],
            ['name' => 'Ahmad Hidayat', 'phone' => '081234567003', 'is_married' => true],
            ['name' => 'Dewi Lestari', 'phone' => '081234567004', 'is_married' => true],
            ['name' => 'Eko Prasetyo', 'phone' => '081234567005', 'is_married' => true],
            ['name' => 'Fitri Handayani', 'phone' => '081234567006', 'is_married' => true],
            ['name' => 'Gunawan Wibowo', 'phone' => '081234567007', 'is_married' => true],
            ['name' => 'Herni Susanti', 'phone' => '081234567008', 'is_married' => false],
            ['name' => 'Irfan Hakim', 'phone' => '081234567009', 'is_married' => true],
            ['name' => 'Joko Widodo', 'phone' => '081234567010', 'is_married' => true],
            ['name' => 'Kartini Putri', 'phone' => '081234567011', 'is_married' => true],
            ['name' => 'Lukman Hakim', 'phone' => '081234567012', 'is_married' => false],
            ['name' => 'Maya Sari', 'phone' => '081234567013', 'is_married' => true],
            ['name' => 'Nur Hidayah', 'phone' => '081234567014', 'is_married' => true],
            ['name' => 'Oscar Pratama', 'phone' => '081234567015', 'is_married' => true],
        ];

        $tetapResidents = [];
        foreach ($tetapNames as $data) {
            $tetapResidents[] = Resident::create([
                'name' => $data['name'],
                'phone' => $data['phone'],
                'status' => 'tetap',
                'is_married' => $data['is_married'],
            ]);
        }

        // 4. Create 5 'kontrak' residents
        $kontrakNames = [
            ['name' => 'Pandu Setiawan', 'phone' => '081234567016', 'is_married' => false],
            ['name' => 'Qori Amalia', 'phone' => '081234567017', 'is_married' => true],
            ['name' => 'Rizki Firmansyah', 'phone' => '081234567018', 'is_married' => false],
            ['name' => 'Sari Dewi', 'phone' => '081234567019', 'is_married' => true],
            ['name' => 'Taufik Rahman', 'phone' => '081234567020', 'is_married' => true],
        ];

        $kontrakResidents = [];
        foreach ($kontrakNames as $data) {
            $kontrakResidents[] = Resident::create([
                'name' => $data['name'],
                'phone' => $data['phone'],
                'status' => 'kontrak',
                'is_married' => $data['is_married'],
            ]);
        }

        // 5. Assign 15 tetap residents to houses 1-15
        $activeHouseResidents = [];
        for ($i = 0; $i < 15; $i++) {
            $hr = HouseResident::create([
                'house_id' => $houses[$i]->id,
                'resident_id' => $tetapResidents[$i]->id,
                'start_date' => Carbon::create(2024, 1, 1),
                'is_active' => true,
            ]);
            $houses[$i]->update(['status' => 'dihuni']);
            $activeHouseResidents[] = $hr;
        }

        // 6. Create historical records for houses 16-18 (previous tenants)
        // House 16 had a previous kontrak tenant
        HouseResident::create([
            'house_id' => $houses[15]->id,
            'resident_id' => $kontrakResidents[3]->id, // Sari Dewi was here before
            'start_date' => Carbon::create(2024, 1, 1),
            'end_date' => Carbon::create(2025, 6, 30),
            'is_active' => false,
        ]);

        // House 17 had a previous kontrak tenant
        HouseResident::create([
            'house_id' => $houses[16]->id,
            'resident_id' => $kontrakResidents[4]->id, // Taufik was here before
            'start_date' => Carbon::create(2024, 3, 1),
            'end_date' => Carbon::create(2025, 8, 31),
            'is_active' => false,
        ]);

        // 7. Assign 3 kontrak residents to houses 16-18
        for ($i = 0; $i < 3; $i++) {
            $hr = HouseResident::create([
                'house_id' => $houses[15 + $i]->id,
                'resident_id' => $kontrakResidents[$i]->id,
                'start_date' => Carbon::create(2025, 7, 1),
                'is_active' => true,
            ]);
            $houses[15 + $i]->update(['status' => 'dihuni']);
            $activeHouseResidents[] = $hr;
        }

        // Houses 19-20 remain vacant (tidak_dihuni)

        // 8. Create sample payments for the last 6 months (Jan 2026 - Jun 2026)
        $paymentMonths = [
            Carbon::create(2026, 1, 1),
            Carbon::create(2026, 2, 1),
            Carbon::create(2026, 3, 1),
            Carbon::create(2026, 4, 1),
            Carbon::create(2026, 5, 1),
            Carbon::create(2026, 6, 1),
        ];

        // Houses that will miss some payments (to show 'belum lunas')
        $missKebersihan = [3, 7, 12]; // indices - miss kebersihan in some months
        $missSatpam = [5, 10, 15];    // indices - miss satpam in some months
        $missMonths = [3, 4]; // month indices (April, May) for missed payments

        foreach ($activeHouseResidents as $index => $hr) {
            foreach ($paymentMonths as $monthIndex => $month) {
                $paidAt = $month->copy()->addDays(rand(1, 10));

                // Kebersihan payment
                $skipKebersihan = in_array($index, $missKebersihan) && in_array($monthIndex, $missMonths);
                if (!$skipKebersihan) {
                    Payment::create([
                        'house_resident_id' => $hr->id,
                        'type' => 'kebersihan',
                        'amount' => 15000,
                        'period_month' => $month->toDateString(),
                        'paid_at' => $paidAt->toDateString(),
                        'notes' => null,
                    ]);
                }

                // Satpam payment
                $skipSatpam = in_array($index, $missSatpam) && in_array($monthIndex, $missMonths);
                if (!$skipSatpam) {
                    Payment::create([
                        'house_resident_id' => $hr->id,
                        'type' => 'satpam',
                        'amount' => 100000,
                        'period_month' => $month->toDateString(),
                        'paid_at' => $paidAt->toDateString(),
                        'notes' => null,
                    ]);
                }
            }
        }

        // 9. Create sample expenses
        foreach ($paymentMonths as $month) {
            // Gaji Satpam - monthly recurring
            Expense::create([
                'title' => 'Gaji Satpam - ' . $month->translatedFormat('F Y'),
                'description' => 'Pembayaran gaji satpam bulanan',
                'amount' => 1500000,
                'expense_date' => $month->copy()->day(25)->toDateString(),
                'category' => 'gaji_satpam',
                'is_recurring' => true,
            ]);

            // Token Listrik Pos - monthly recurring
            Expense::create([
                'title' => 'Token Listrik Pos - ' . $month->translatedFormat('F Y'),
                'description' => 'Pembelian token listrik untuk pos keamanan',
                'amount' => 200000,
                'expense_date' => $month->copy()->day(15)->toDateString(),
                'category' => 'listrik_pos',
                'is_recurring' => true,
            ]);
        }

        // One-time expenses
        Expense::create([
            'title' => 'Perbaikan Jalan Utama',
            'description' => 'Perbaikan jalan utama blok A yang rusak akibat hujan',
            'amount' => 2500000,
            'expense_date' => Carbon::create(2026, 3, 15)->toDateString(),
            'category' => 'perbaikan_jalan',
            'is_recurring' => false,
        ]);

        Expense::create([
            'title' => 'Perbaikan Selokan Blok A',
            'description' => 'Pembersihan dan perbaikan selokan yang tersumbat',
            'amount' => 1000000,
            'expense_date' => Carbon::create(2026, 5, 20)->toDateString(),
            'category' => 'perbaikan_selokan',
            'is_recurring' => false,
        ]);

        Expense::create([
            'title' => 'Pembelian HT Security',
            'description' => 'Pembelian 2 unit HT untuk komunikasi satpam',
            'amount' => 750000,
            'expense_date' => Carbon::create(2026, 2, 10)->toDateString(),
            'category' => 'lainnya',
            'is_recurring' => false,
        ]);
    }
}
