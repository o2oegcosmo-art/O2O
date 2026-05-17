const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const phpScript = `<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();
use Illuminate\\Support\\Facades\\DB;

$log = DB::table('ai_security_logs')->orderBy('id', 'desc')->first();
echo json_encode($log, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
`;
  
  const cmd = `cd /var/www/o2oeg/backend && cat << 'EOF' > check_ai.php
${phpScript}
EOF
php check_ai.php && rm check_ai.php`;

  conn.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '72.62.182.106', port: 22, username: 'root', password: 'Amzabola@224466' });
