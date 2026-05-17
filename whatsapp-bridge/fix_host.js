const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const ROOT = '/var/www/o2oeg';

console.log('🚀 Changing localhost to 127.0.0.1 for maximum compatibility...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    // Update .env to use 127.0.0.1 instead of localhost
    `sed -i 's/WHATSAPP_BRIDGE_URL=http:\\/\\/localhost:9005/WHATSAPP_BRIDGE_URL=http:\\/\\/127.0.0.1:9005/g' ${ROOT}/backend/.env`,
    
    // Clear cache to apply changes
    `cd ${ROOT}/backend && php artisan config:clear`,
    
    // Restart the bridge one last time to be safe
    `pkill -9 node || true`,
    `cd ${ROOT}/whatsapp-bridge && (nohup node index.js > bridge.log 2>&1 &)`,
    
    `echo "✅ RE-LINKED SUCCESSFULLY!"`
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
