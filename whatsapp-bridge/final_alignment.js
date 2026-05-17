const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const ROOT = '/var/www/o2oeg';

console.log('🚀 Final System Alignment & Activation...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    // 0. Sync Code
    `cd ${ROOT} && git fetch --all && git reset --hard origin/main`,
    
    // 1. Fix APP_URL (CRITICAL for webhooks and logic)
    `sed -i 's|APP_URL=.*|APP_URL=https://o2oeg.com|g' ${ROOT}/backend/.env`,
    
    // 2. Fix bridge variables (Ensure 127.0.0.1 and use_bridge=true)
    `sed -i 's/WHATSAPP_USE_BRIDGE=false/WHATSAPP_USE_BRIDGE=true/g' ${ROOT}/backend/.env`,
    `sed -i 's|WHATSAPP_BRIDGE_URL=.*|WHATSAPP_BRIDGE_URL=http://127.0.0.1:9005|g' ${ROOT}/backend/.env`,
    
    // 3. Update LeadController.php to use the NEW WhatsAppService logic
    // We replace the hardcoded curl with the clean service call
    `sed -i 's|\\$bridgeUrl = .*;|\\$whatsappService = app(\\\\App\\\\Services\\\\WhatsAppService::class);|g' ${ROOT}/backend/app/Http/Controllers/Api/LeadController.php`,
    `sed -i 's|\\$client = new .*;||g' ${ROOT}/backend/app/Http/Controllers/Api/LeadController.php`,
    `sed -i 's|\\$response = \\$client-\u003epost.*;|\\$whatsapp_sent = \\$whatsappService-\u003esendMessage(\\$phone, \\$message);|g' ${ROOT}/backend/app/Http/Controllers/Api/LeadController.php`,
    
    // 4. Clear cache to force new config
    `cd ${ROOT}/backend && php artisan optimize:clear`,
    
    // 5. Restart Bridge to be 100% sure
    `pkill -9 node || true`,
    `cd ${ROOT}/whatsapp-bridge && (nohup node index.js > bridge.log 2>&1 &)`,
    
    `echo "✅ SYSTEM ALIGNED AND READY FOR ACTION!"`
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
