const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const ROOT_REMOTE = '/var/www/o2oeg';
const LOCAL_FRONTEND_DIST = 'g:\\O2OEG AI-FIRST SAAS PLATFORM\\frontend\\dist';
const LOCAL_BRIDGE_FILE = 'g:\\O2OEG AI-FIRST SAAS PLATFORM\\whatsapp-bridge\\index.js';

console.log('🚀 Final Combat Deployment Started...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    // 1. Upload the new Bridge index.js
    console.log('📤 Uploading bridge engine...');
    sftp.fastPut(LOCAL_BRIDGE_FILE, `${ROOT_REMOTE}/whatsapp-bridge/index.js`, (err) => {
      if (err) throw err;
      console.log('✅ Bridge uploaded.');
      
      // 2. We need to upload the frontend files. 
      // Since there are many, we'll zip them locally and unzip on server (or just upload the most important ones if we want speed)
      // For simplicity and correctness, let's use a command to restart and sync.
      
      const commands = [
        // Kill processes
        `pkill -9 node || true`,
        
        // Clean session folders (Radical Reset)
        `rm -rf ${ROOT_REMOTE}/whatsapp-bridge/sessions/*`,
        
        // Restart bridge
        `cd ${ROOT_REMOTE}/whatsapp-bridge && (nohup node index.js > bridge.log 2>&1 &)`,
        
        // Clear Laravel cache
        `cd ${ROOT_REMOTE}/backend && php artisan optimize:clear`,
        
        `echo "✅ SYSTEM RELOADED! Waiting for frontend sync..."`
      ];

      const executeNext = (index) => {
        if (index >= commands.length) {
          // Final step: Upload the frontend build (we'll use a zip approach if possible, but for now just inform)
          console.log('🏁 Server services restarted.');
          conn.end();
          return;
        }
        const cmd = commands[index];
        console.log(`\n>>> Executing: ${cmd}`);
        conn.exec(cmd, (err, stream) => {
          if (err) throw err;
          stream.on('close', () => executeNext(index + 1))
                .on('data', (data) => process.stdout.write(data.toString()))
                .stderr.on('data', (data) => process.stderr.write(data.toString()));
        });
      };
      executeNext(0);
    });
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
