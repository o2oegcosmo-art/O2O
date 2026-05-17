const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const BRIDGE_FILE_LOCAL = 'g:\\O2OEG AI-FIRST SAAS PLATFORM\\whatsapp-bridge\\index.js';
const BRIDGE_FILE_REMOTE = '/var/www/o2oeg/whatsapp-bridge/index.js';

console.log('🚀 Uploading Clean Bridge Engine to Server...');

// First, read the local file to make sure we have the latest version with the "app.all" fix
let localContent = fs.readFileSync(BRIDGE_FILE_LOCAL, 'utf8');

// Ensure /init and /logout are flexible (app.all)
localContent = localContent.replace(/app\.post\('\/init\/:tenantId'/g, "app.all('/init/:tenantId'");
localContent = localContent.replace(/app\.post\('\/logout\/:tenantId'/g, "app.all('/logout/:tenantId'");

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    const writeStream = sftp.createWriteStream(BRIDGE_FILE_REMOTE);
    writeStream.on('close', () => {
      console.log('✅ File uploaded successfully!');
      
      // Now restart the bridge
      conn.exec(`pkill -9 node || true; cd /var/www/o2oeg/whatsapp-bridge && (nohup node index.js > bridge.log 2>&1 &)`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
          console.log('✅ Bridge Restarted with CLEAN logic!');
          conn.end();
        }).on('data', (data) => console.log(data.toString()));
      });
    });
    writeStream.write(localContent);
    writeStream.end();
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
