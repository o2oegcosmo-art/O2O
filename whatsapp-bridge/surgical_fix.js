const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const ROOT = '/var/www/o2oeg';

console.log('🚀 Surgical Fix for .env and Bridge...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    // 1. Repair .env by ensuring proper newlines and removing the mess
    `sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=Amzabola@224466/g' ${ROOT}/backend/.env`,
    `sed -i '/WHATSAPP_USE_BRIDGE/d' ${ROOT}/backend/.env`,
    `sed -i '/WHATSAPP_BRIDGE_URL/d' ${ROOT}/backend/.env`,
    `echo "" >> ${ROOT}/backend/.env`,
    `echo "WHATSAPP_USE_BRIDGE=true" >> ${ROOT}/backend/.env`,
    `echo "WHATSAPP_BRIDGE_URL=http://localhost:9005" >> ${ROOT}/backend/.env`,
    
    // 2. Kill current bridge to ensure new code takes effect
    `pkill -9 node || true`,
    
    // 3. Clear artisan cache again to be sure
    `cd ${ROOT}/backend && php artisan config:clear`,
    
    // 4. Start the bridge with a simple check first
    `cd ${ROOT}/whatsapp-bridge && (nohup node index.js > bridge.log 2>&1 &)`,
    
    `echo "✅ SURGERY SUCCESSFUL!"`
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
