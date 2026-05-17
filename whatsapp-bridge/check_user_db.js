const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

console.log('🔍 Checking database state for user 01062562136...');

conn.on('ready', () => {
  const phpScript = `
<?php
define('LARAVEL_START', microtime(true));
require '/var/www/o2oeg/backend/vendor/autoload.php';
$app = require_once '/var/www/o2oeg/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Http\\Kernel::class);
$kernel->handle(Illuminate\\Http\\Request::capture());

$user = App\\Models\\User::where('phone','01062562136')->with(['tenant.activeSubscription'])->first();
if (!$user) { echo "USER NOT FOUND\\n"; exit; }

echo "USER: " . $user->name . "\\n";
echo "ROLE: " . $user->role . "\\n";
echo "BUSINESS_CATEGORY: " . $user->business_category . "\\n";
echo "TENANT_ID: " . $user->tenant_id . "\\n";

if ($user->tenant) {
    echo "TENANT NAME: " . $user->tenant->name . "\\n";
    echo "TENANT STATUS: " . $user->tenant->status . "\\n";
    echo "ONBOARDING: " . ($user->tenant->onboarding_completed ? 'true' : 'false') . "\\n";
    echo "HAS_SUBSCRIPTION: " . ($user->tenant->activeSubscription ? 'YES - Plan ID: ' . $user->tenant->activeSubscription->plan_id : 'NO') . "\\n";
} else {
    echo "TENANT: NULL - THIS IS THE PROBLEM!\\n";
}
`;
  require('fs').writeFileSync('/tmp/check_user.php', phpScript);
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    sftp.fastPut('/tmp/check_user.php', '/var/www/o2oeg/backend/check_user.php', (err) => {
      if (err) { console.error('Upload failed:', err); conn.end(); return; }
      conn.exec('php /var/www/o2oeg/backend/check_user.php && rm /var/www/o2oeg/backend/check_user.php', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', d => process.stdout.write(d.toString()))
              .stderr.on('data', d => process.stderr.write(d.toString()));
      });
    });
  });
}).connect(config);
