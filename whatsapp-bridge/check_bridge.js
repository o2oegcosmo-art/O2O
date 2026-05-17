const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const BRIDGE_DIR = '/var/www/o2oeg/whatsapp-bridge';

console.log('🚀 Checking WhatsApp Bridge Logs on Server...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    `tail -n 50 ${BRIDGE_DIR}/bridge.log`,
    `ls -la ${BRIDGE_DIR}/sessions`,
    `ps -aux | grep node`,
    `netstat -tulpn | grep 3001` // Checking if the bridge port is active
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
