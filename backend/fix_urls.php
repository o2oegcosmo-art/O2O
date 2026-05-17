<?php
use Illuminate\Support\Facades\DB;
DB::table('services')->update(['image_url' => DB::raw("REPLACE(image_url, 'https://o2oeg.com', 'http://127.0.0.1:8000')")]);
echo "Updated URLs\n";
