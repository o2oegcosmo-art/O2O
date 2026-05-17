const { Client } = require('ssh2');

const HOST = '72.62.182.106';
const USER = 'root';
const PASSWORD = 'O2OEG_Secure_Shield_2026_#646';
const REPO_DIR = '/var/www/o2oeg';

const conn = new Client();
conn.on('ready', () => {
    console.log('🚀 [LIVE] Starting Remote Factory Reset...');

    // Fixed migration content
    const migrationContent = `<?php
use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\Facades\\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('video_projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->string('name');
            $table->string('template_id')->default('salon-intro');
            $table->json('props')->nullable();
            $table->enum('status', ['draft', 'rendered', 'published'])->default('draft');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('video_projects');
    }
};`;

    const base64Content = Buffer.from(migrationContent).toString('base64');

    const cmd = `
        cd ${REPO_DIR}/backend
        
        # Overwrite the problematic migration file using base64 to avoid escaping issues
        echo "${base64Content}" | base64 -d > database/migrations/2026_05_09_174554_create_video_projects_table.php
        
        # 1. Run migrate:fresh --seed
        echo "--- WIPING AND RE-SEEDING LIVE DATABASE ---"
        php artisan migrate:fresh --seed --force
        
        # 2. Clear all caches
        echo "--- CLEARING SYSTEM CACHES ---"
        php artisan config:clear
        php artisan cache:clear
        php artisan view:clear
        php artisan route:clear
        
        # 3. Final Verification
        echo "--- VERIFICATION ---"
        echo "Tenants count:"
        php artisan tinker --execute="echo App\\\\Models\\\\Tenant::count();"
        echo "Users count:"
        php artisan tinker --execute="echo App\\\\Models\\\\User::count();"
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\n✅ [LIVE] Factory Reset Completed Successfully!');
            conn.end();
        });
    });
}).on('error', e => {
    console.error('❌ Connection error:', e.message);
}).connect({ host: HOST, port: 22, username: USER, password: PASSWORD });
