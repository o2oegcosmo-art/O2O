const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const ROOT_REMOTE = '/var/www/o2oeg';
const LOCAL_TAR = 'g:\\O2OEG AI-FIRST SAAS PLATFORM\\frontend\\dist.tar.gz';
const LOCAL_BRIDGE = 'g:\\O2OEG AI-FIRST SAAS PLATFORM\\whatsapp-bridge\\index.js';

console.log('🚀 Ultimate Deployment Mission Started...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    console.log('📤 Uploading Frontend & Bridge...');
    sftp.fastPut(LOCAL_TAR, `${ROOT_REMOTE}/dist.tar.gz`, (err) => {
      if (err) throw err;
      sftp.fastPut(LOCAL_BRIDGE, `${ROOT_REMOTE}/whatsapp-bridge/index.js`, (err) => {
        if (err) throw err;
        
        console.log('✅ Files uploaded. Activating...');
        
        const commands = [
          // 1. Unpack frontend
          `cd ${ROOT_REMOTE} && tar -xzf dist.tar.gz`,
          `cp -r ${ROOT_REMOTE}/dist/* ${ROOT_REMOTE}/backend/public/`,
          
          // 2. Kill and Reset Bridge
          `pkill -9 node || true`,
          `rm -rf ${ROOT_REMOTE}/whatsapp-bridge/sessions/*`,
          `cd ${ROOT_REMOTE}/whatsapp-bridge && (nohup node index.js > bridge.log 2>&1 &)`,
          
          // 3. Cleanup
          `rm ${ROOT_REMOTE}/dist.tar.gz`,
          `cd ${ROOT_REMOTE}/backend && php artisan optimize:clear`,
          
          `echo "✅ MISSION ACCOMPLISHED! System updated."`
        ];

        const executeNext = (index) => {
          if (index >= commands.length) {
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
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
