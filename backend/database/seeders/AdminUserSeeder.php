<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = '550e8400-e29b-41d4-a716-446655440000';
        
        // Create Tenant if not exists
        $tenant = Tenant::firstOrCreate(
            ['id' => $tenantId],
            [
                'name'            => 'O2OEG Platform Admin',
                'domain'          => 'admin.o2oeg.local',
                'status'          => 'active',
                'has_full_access' => true
            ]
        );

        // Update or create Admin User by email (email is the reliable unique key here)
        User::updateOrCreate(
            ['email' => 'admin@o2oeg.com'],
            [
                'tenant_id' => $tenant->id,
                'name'      => 'Admin User',
                'phone'     => '01044167626', // secondary admin – distinct from main owner account
                'password'  => Hash::make('O2OEG_Secure_Shield_2026_#646'),
                'role'      => 'admin'
            ]
        );
    }
}
