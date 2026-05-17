const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const BRIDGE_DIR = '/var/www/o2oeg/whatsapp-bridge';

console.log('🚀 Inspecting active sessions to fix Logout button...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    // 1. List sessions folders
    `ls -la ${BRIDGE_DIR}/sessions`,
    
    // 2. Check the bridge logs for logout attempts
    `tail -n 50 ${BRIDGE_DIR}/bridge.log | grep logout || echo "No logout logs found"`,
    
    // 3. Check what ID the bridge is currently using for the admin
    `grep -r "Connected successfully" ${BRIDGE_DIR}/bridge.log | tail -n 5`
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
