const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

console.log('🚀 MISSION: RESCUE LIVE BRIDGE');

conn.on('ready', () => {
  console.log('📡 Connected to Live Server!');
  
  const commands = [
    // 1. Kill any existing node processes aggressively
    'pkill -9 node || true',
    
    // 2. Clear out any stalled sessions if necessary (optional, but let's stick to just restarting first)
    // 'rm -rf /var/www/o2oeg/whatsapp-bridge/sessions/session_00000000-0000-0000-0000-000000000000/*',
    
    // 3. Start the bridge using nohup
    'cd /var/www/o2oeg/whatsapp-bridge && (nohup node index.js > bridge.log 2>&1 &)',
    
    // 4. Wait a few seconds for startup
    'sleep 5',
    
    // 5. Verify if port 9005 is listening
    'netstat -tulpn | grep 9005',
    
    // 6. Check if process is running
    'ps aux | grep node | grep index.js'
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
      console.log('\n✅ RESCUE COMMANDS EXECUTED.');
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
