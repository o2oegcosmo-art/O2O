const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('📡 Connected! Cleaning database...\n');
  const phpScript = `<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();
use Illuminate\\Support\\Facades\\DB;

DB::statement('SET FOREIGN_KEY_CHECKS=0;');
DB::table('messages')->truncate();
DB::table('will_ai_logs')->truncate();
DB::table('whatsapp_messages')->truncate();
DB::table('bookings')->truncate();
DB::table('customers')->truncate();
DB::statement('SET FOREIGN_KEY_CHECKS=1;');

echo "All chat history, bookings, and customers cleaned successfully!\\n";
`;
  
  const cmd = `cd /var/www/o2oeg/backend && cat << 'EOF' > wipe_all.php
${phpScript}
EOF
php wipe_all.php && rm wipe_all.php`;

  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err); return; }
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
        console.log('✅ Wiped successfully');
        conn.end()
    });
  });
}).connect({ host: '72.62.182.106', port: 22, username: 'root', password: 'Amzabola@224466' });
