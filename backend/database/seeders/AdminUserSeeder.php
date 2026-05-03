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
                'name' => 'O2OEG Platform Admin',
                'domain' => 'admin.o2oeg.local',
                'status' => 'active',
                'has_full_access' => true
            ]
        );

        // Create Admin User
        User::firstOrCreate(
            ['phone' => '01234567890'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Admin User',
                'email' => 'admin@o2oeg.com',
                'password' => Hash::make('password123'),
                'role' => 'admin'
            ]
        );
    }
}
