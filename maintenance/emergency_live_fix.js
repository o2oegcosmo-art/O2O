const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

const migrationContent = "<?php\n\nuse Illuminate\\Database\\Migrations\\Migration;\nuse Illuminate\\Database\\Schema\\Blueprint;\nuse Illuminate\\Support\\Facades\\Schema;\n\nreturn new class extends Migration\n{\n    public function up(): void\n    {\n        Schema::table('personal_access_tokens', function (Blueprint $table) {\n            $table->dropColumn(['tokenable_id', 'tokenable_type']);\n        });\n\n        Schema::table('personal_access_tokens', function (Blueprint $table) {\n            $table->uuidMorphs('tokenable');\n        });\n    }\n\n    public function down(): void\n    {\n        Schema::table('personal_access_tokens', function (Blueprint $table) {\n            $table->dropColumn(['tokenable_id', 'tokenable_type']);\n        });\n        \n        Schema::table('personal_access_tokens', function (Blueprint $table) {\n            $table->morphs('tokenable');\n        });\n    }\n};";

console.log('🚀 Connecting to Live Server for EMERGENCY FIX...');

conn.on('ready', () => {
  console.log('📡 Connected! Executing emergency commands...');
  
  // 1. Create the migration file on the server
  // 2. Run the migration
  const cmd = `cat > /var/www/o2oeg/backend/database/migrations/2026_05_14_000000_fix_personal_access_tokens_for_uuids.php << 'EOF'
${migrationContent}
EOF
cd /var/www/o2oeg/backend && php artisan migrate --force`;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('❌ Execution error:', err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log(`✅ Emergency Fix Finished with code ${code}`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
