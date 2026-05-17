const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const ROOT = '/var/www/o2oeg';

console.log('🚀 Diagnosing Backend-to-Bridge failure...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    // 1. Check the last few lines of Laravel log for bridge errors
    `tail -n 20 ${ROOT}/backend/storage/logs/laravel.log`,
    
    // 2. Check if the bridge is actually listening on 9005
    `netstat -tulpn | grep 9005`,
    
    // 3. Test internal connectivity from PHP's perspective (if possible)
    `php -r "echo file_get_contents('http://127.0.0.1:9005/status/0');" || echo "PHP cannot reach bridge"`
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
      conn.end();
      return;
    }
    const cmd = commands[index];
    console.log(`\n>>> Executing: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error('Error:', err); conn.end(); return; }
      stream.on('close', () => executeNext(index + 1))
            .on('data', (data) => process.stdout.write(data.toString()))
            .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
  };
  executeNext(0);
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
