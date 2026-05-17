const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106', port: 22, username: 'root', password: 'O2OEG_Secure_Shield_2026_#646'
};

const cmd = `
cd /var/www/o2oeg/backend && 
php artisan cache:clear && 
php artisan config:clear && 
php artisan route:clear && 
php artisan view:clear && 
mysql -u o2o_user -pAmzabola@224466 o2oeg -e "
  SET FOREIGN_KEY_CHECKS = 0; 
  TRUNCATE leads; 
  DELETE FROM tenants WHERE id != '00000000-0000-0000-0000-000000000000'; 
  DELETE FROM users WHERE tenant_id != '00000000-0000-0000-0000-000000000000'; 
  TRUNCATE services; 
  TRUNCATE products; 
  TRUNCATE bookings; 
  TRUNCATE retail_orders; 
  TRUNCATE customers; 
  SET FOREIGN_KEY_CHECKS = 1;
" && 
php artisan db:seed --class=ServiceSeeder && 
php artisan db:seed --class=PlanSeeder
`;

conn.on('ready', () => {
  console.log('📡 Connected for DEEP PURGE...');
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ LIVE SERVER PURGED AND RESET SUCCESSFULLY!');
      conn.end();
    }).on('data', (data) => process.stdout.write(data.toString()))
      .stderr.on('data', (data) => process.stderr.write(data.toString()));
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
