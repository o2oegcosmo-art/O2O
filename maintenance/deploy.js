const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

console.log('🚀 Connecting to Live Server for Deployment...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    'cd /var/www/o2oeg && git pull origin main',
    'cd /var/www/o2oeg/backend && php artisan migrate --force',
    'cd /var/www/o2oeg/backend && php artisan db:seed --class=ServiceSeeder --force',
    'cd /var/www/o2oeg/backend && php artisan db:seed --class=PlanSeeder --force',
    'cd /var/www/o2oeg/frontend && npm run build',
    'systemctl restart nginx',
    'systemctl restart php8.2-fpm'
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
      console.log('✅ Deployment Finished!');
      conn.end();
      return;
    }
    const cmd = commands[index];
    console.log(`Executing: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) {
          console.error('Error executing: ' + cmd, err);
          conn.end();
          return;
      }
      stream.on('close', (code, signal) => {
          console.log(`Command finished with code ${code}`);
          executeNext(index + 1);
      }).on('data', (data) => {
          process.stdout.write(data.toString());
      }).stderr.on('data', (data) => {
          process.stderr.write(data.toString());
      });
    });
  };
  executeNext(0);
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
