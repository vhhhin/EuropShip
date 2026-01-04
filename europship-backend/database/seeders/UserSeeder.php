<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    public function run()
    {
        $now = Carbon::now();

        $users = [
            ['email' => 'houssamghazzouz@europship.com', 'role' => 'agent', 'status' => 'active', 'created_at' => $now, 'updated_at' => $now],
            ['email' => 'adib@europship.com', 'role' => 'agent', 'status' => 'active', 'created_at' => $now, 'updated_at' => $now],
            ['email' => 'yassinfallahi@europship.com', 'role' => 'agent', 'status' => 'active', 'created_at' => $now, 'updated_at' => $now],
            ['email' => 'rabimastour@europship.com', 'role' => 'agent', 'status' => 'active', 'created_at' => $now, 'updated_at' => $now],
            ['email' => 'admin@europship.com', 'role' => 'admin', 'status' => 'active', 'created_at' => $now, 'updated_at' => $now],
            ['email' => 'platform-admin@europship.com', 'role' => 'admin', 'status' => 'active', 'created_at' => $now, 'updated_at' => $now],
            ['email' => 'contact@europship.com', 'role' => 'admin', 'status' => 'active', 'created_at' => $now, 'updated_at' => $now],
        ];

        foreach ($users as $user) {
            DB::table('users')->updateOrInsert(
                ['email' => $user['email']],
                $user
            );
        }
    }
}
