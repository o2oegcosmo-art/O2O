const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

conn.on('ready', () => {
  // First verify current web.php content, then clear all caches
  const commands = [
    'echo "=== CURRENT web.php CONTENT ===" && head -n 15 /var/www/o2oeg/backend/routes/web.php',
    'echo "=== PHP SYNTAX CHECK ===" && php -l /var/www/o2oeg/backend/routes/web.php',
    'echo "=== CLEARING ALL CACHES ===" && cd /var/www/o2oeg/backend && php artisan config:clear && php artisan route:clear && php artisan cache:clear',
    'echo "=== LATEST LOG ERRORS ===" && tail -n 20 /var/www/o2oeg/backend/storage/logs/laravel.log | grep -E "ERROR|WARN" | tail -5'
  ];

  let idx = 0;
  const next = () => {
    if (idx >= commands.length) { conn.end(); return; }
    conn.exec(commands[idx++], (err, stream) => {
      if (err) throw err;
      stream.on('close', next)
            .on('data', d => process.stdout.write(d.toString()))
            .stderr.on('data', d => process.stderr.write(d.toString()));
    });
  };
  next();
}).connect(config);
