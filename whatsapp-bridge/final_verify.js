const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

console.log('🚀 Final Verification of QR Generation...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    // 1. Initialize session for Tenant 0 (Admin) via POST (as defined in code)
    `curl -X POST -s "http://localhost:9005/init/0"`,
    
    // 2. Wait 3 seconds for Baileys to generate QR
    `sleep 3`,
    
    // 3. Check status
    `curl -s "http://localhost:9005/status/0"`,
    
    `echo "\n✅ VERIFICATION COMPLETE!"`
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
