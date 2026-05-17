const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

console.log('🚀 MISSION: START AI QUEUE WORKER');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    // 1. Kill any existing artisan processes to be clean
    'pkill -f artisan || true',
    
    // 2. Start queue worker in background
    'cd /var/www/o2oeg/backend && (nohup php artisan queue:work --tries=3 --timeout=120 > storage/logs/worker.log 2>&1 &)',
    
    // 3. Verify
    'sleep 2',
    'ps aux | grep artisan'
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
      console.log('\n✅ QUEUE WORKER STARTED.');
      conn.end();
      return;
    }
    const cmd = commands[index];
    console.log(`\n>>> Executing: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error('Error:', err); conn.end(); return; }
      stream.on('data', (data) => process.stdout.write(data.toString()))
            .stderr.on('data', (data) => process.stderr.write(data.toString()))
            .on('close', () => executeNext(index + 1));
    });
  };
  executeNext(0);
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
