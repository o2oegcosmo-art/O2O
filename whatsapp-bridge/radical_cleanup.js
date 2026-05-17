const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const BRIDGE_DIR = '/var/www/o2oeg/whatsapp-bridge';

console.log('🚀 Executing RADICAL CLEANUP of sessions...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    // 1. Kill all bridge processes
    `pkill -9 node || true`,
    
    // 2. FORCE DELETE ALL SESSIONS (Radical)
    `rm -rf ${BRIDGE_DIR}/sessions/*`,
    `echo "✅ All session files DESTROYED."`,
    
    // 3. Verify they are gone
    `ls -la ${BRIDGE_DIR}/sessions`,
    
    // 4. Restart the bridge
    `cd ${BRIDGE_DIR} && (nohup node index.js > bridge.log 2>&1 &)`,
    `echo "✅ Bridge RESTARTED in clean state."`
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
