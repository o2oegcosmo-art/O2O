const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

// Use direct SQL for absolute certainty and simplicity
const cmd = `mysql -u o2o_user -pAmzabola@224466 o2oeg -e "
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM tenants WHERE id != '00000000-0000-0000-0000-000000000000';
DELETE FROM users WHERE tenant_id != '00000000-0000-0000-0000-000000000000';
DELETE FROM services WHERE tenant_id != '00000000-0000-0000-0000-000000000000';
DELETE FROM products WHERE tenant_id != '00000000-0000-0000-0000-000000000000';
DELETE FROM bookings WHERE tenant_id != '00000000-0000-0000-0000-000000000000';
DELETE FROM retail_orders WHERE tenant_id != '00000000-0000-0000-0000-000000000000';
DELETE FROM customers WHERE tenant_id != '00000000-0000-0000-0000-000000000000';
SET FOREIGN_KEY_CHECKS = 1;
"`;

conn.on('ready', () => {
  console.log('📡 Connected for DATABASE CLEANUP...');
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ DATABASE CLEANED SUCCESSFULLY! Only Management Hub remains.');
      conn.end();
    }).on('data', (data) => process.stdout.write(data.toString()))
      .stderr.on('data', (data) => process.stderr.write(data.toString()));
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
