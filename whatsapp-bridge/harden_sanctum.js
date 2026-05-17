const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

console.log('🛠️ Hardening Sanctum Stateful Domains on Live Server...');

conn.on('ready', () => {
  const commands = [
    // Add SANCTUM_STATEFUL_DOMAINS if not exists, otherwise update it
    'grep -q "SANCTUM_STATEFUL_DOMAINS" /var/www/o2oeg/backend/.env || echo "SANCTUM_STATEFUL_DOMAINS=o2oeg.com,www.o2oeg.com,localhost,127.0.0.1" >> /var/www/o2oeg/backend/.env',
    'sed -i "s/SESSION_DOMAIN=null/SESSION_DOMAIN=.o2oeg.com/g" /var/www/o2oeg/backend/.env',
    'cd /var/www/o2oeg/backend && php artisan config:clear && php artisan optimize'
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
      console.log('✅ Configuration Hardened!');
      conn.end();
      return;
    }
    conn.exec(commands[index], (err, stream) => {
      if (err) throw err;
      stream.on('close', () => executeNext(index + 1))
            .on('data', (data) => process.stdout.write(data.toString()))
            .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
  };
  executeNext(0);
}).connect(config);
