const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

console.log('🚀 Searching for old bridges and Nginx proxy settings...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const commands = [
    // 1. Find all folders named *bridge* in /var/www
    `find /var/www -name "*bridge*" -type d`,
    
    // 2. Check Nginx configuration for "/bridge" proxy
    `grep -r "/bridge" /etc/nginx/`,
    
    // 3. Check for any running process on port 3000, 3001, or 9005
    `netstat -tulpn | grep -E "3000|3001|9005"`,
    
    // 4. Check for existing PM2 processes (often used for bridges)
    `pm2 list || echo "PM2 not installed"`
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
