const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', async () => {
  console.log('📡 Connected - Fixing Queue Worker + service_id + Groq key check...\n');
  
  const commands = [
    // 1. Check Groq key in .env
    `grep "GROQ" /var/www/o2oeg/backend/.env`,
    
    // 2. Check queue worker config - what sleep time is set
    `grep -E "sleep|retry|timeout" /var/www/o2oeg/backend/.env | head -5`,
    
    // 3. Check if services exist for this tenant
    `cd /var/www/o2oeg/backend && php artisan tinker --execute="echo json_encode(\\App\\Models\\Service::where('tenant_id','019e02ab-2f55-72e9-8cc8-ad8bcb4cef6d')->get(['id','name'])->toArray());"`,
    
    // 4. Check queue worker process
    `ps aux | grep "queue:work" | grep -v grep`,
    
    // 5. Check bookings table - is service_id nullable?
    `cd /var/www/o2oeg/backend && php artisan tinker --execute="\\$col = DB::select(\\\"SHOW COLUMNS FROM bookings WHERE Field='service_id'\\\"); echo json_encode(\\$col);"`,
  ];
  
  const run = (cmd) => new Promise(resolve => {
    console.log(`\n>>> ${cmd.substring(0, 80)}`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error(err); resolve(); return; }
      stream.on('data', d => process.stdout.write(d));
      stream.stderr.on('data', d => process.stderr.write(d));
      stream.on('close', resolve);
    });
  });
  
  for (const cmd of commands) await run(cmd);
  console.log('\n✅ Diagnosis Complete!');
  conn.end();
}).connect({ host: '72.62.182.106', port: 22, username: 'root', password: 'Amzabola@224466' });
