const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

console.log('🔍 Checking program paths...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    'which node',
    'which php'
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
      conn.end();
      return;
    }
    const cmd = commands[index];
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
