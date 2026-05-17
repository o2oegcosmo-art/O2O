const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const NGINX_CONF = '/etc/nginx/sites-enabled/default'; // Based on previous cat output

console.log('🚀 Injecting /bridge proxy into Nginx...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  const bridgeLocation = `
    location /bridge/ {
        proxy_pass http://127.0.0.1:9005/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
  `;

  // We need to insert this before the "location /" block or within the server block
  // Let's use a temporary file to rebuild the config safely
  const commands = [
    // 1. Create a backup
    `cp ${NGINX_CONF} ${NGINX_CONF}.bak`,
    
    // 2. Use sed to insert the location block before the "location /" block
    // We'll search for "location / {" and insert before it
    `sed -i '/location \\/ {/i \\    location /bridge/ {\\n        proxy_pass http://127.0.0.1:9005/;\\n        proxy_http_version 1.1;\\n        proxy_set_header Upgrade $http_upgrade;\\n        proxy_set_header Connection "upgrade";\\n        proxy_set_header Host $host;\\n        proxy_cache_bypass $http_upgrade;\\n    }' ${NGINX_CONF}`,
    
    // 3. Test Nginx config
    `nginx -t`,
    
    // 4. Reload Nginx
    `systemctl reload nginx`,
    
    `echo "✅ NGINX PROXY ESTABLISHED!"`
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
