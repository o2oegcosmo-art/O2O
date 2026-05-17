const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const ROOT = '/var/www/o2oeg';

console.log('🚀 Fixing WhatsApp Integration & Bridge Endpoints...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    // 1. Update Backend .env to use the bridge
    `sed -i 's/WHATSAPP_DRIVER=twilio/WHATSAPP_DRIVER=bridge/g' ${ROOT}/backend/.env`,
    `echo "WHATSAPP_USE_BRIDGE=true" >> ${ROOT}/backend/.env`,
    `echo "WHATSAPP_BRIDGE_URL=http://localhost:9005" >> ${ROOT}/backend/.env`,
    
    // 2. Fix bridge index.js to allow GET for /init (easier for debugging/triggering)
    `sed -i 's/app.post(\"\\/init\\/:tenantId\"/app.all(\"\\/init\\/:tenantId\"/g' ${ROOT}/whatsapp-bridge/index.js`,
    
    // 3. Restart everything
    `pkill -9 node || true`,
    `cd ${ROOT}/backend && php artisan optimize:clear`,
    `cd ${ROOT}/whatsapp-bridge && (nohup node index.js > bridge.log 2>&1 &)`,
    
    `echo "✅ SETTINGS UPDATED! Bridge restarted."`
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
      conn.end();
      return;
    }
    const cmd = commands[index];
    console.log(`\n>>> Executing: {cmd}`);
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
