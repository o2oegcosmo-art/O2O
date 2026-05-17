const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

console.log('🚀 Inspecting Nginx configurations for /bridge proxy...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    // 1. List all nginx site configs
    `ls -la /etc/nginx/sites-enabled/`,
    
    // 2. Cat the default config or any specific one found
    `cat /etc/nginx/sites-enabled/*`,
    
    // 3. Check for any other proxy config in /etc/nginx/conf.d/
    `ls -la /etc/nginx/conf.d/`,
    `cat /etc/nginx/conf.d/* || echo "No extra configs"`
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
