const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const REMOTE_PATH = '/var/www/o2oeg';
const LOCAL_TAR = 'g:\\O2OEG AI-FIRST SAAS PLATFORM\\frontend\\dist.tar.gz';

const conn = new Client();

conn.on('ready', () => {
  console.log('📡 Connected to server for legal pages deployment...');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    console.log('📤 Uploading dist.tar.gz...');
    sftp.fastPut(LOCAL_TAR, `${REMOTE_PATH}/dist.tar.gz`, (err) => {
      if (err) {
          console.error('Upload failed:', err);
          conn.end();
          return;
      }
      
      console.log('✅ Upload complete. Unpacking...');
      
      const commands = [
        `cd ${REMOTE_PATH} && tar -xzf dist.tar.gz`,
        `cp -r ${REMOTE_PATH}/dist/* ${REMOTE_PATH}/backend/public/`,
        `rm ${REMOTE_PATH}/dist.tar.gz`,
        `rm -rf ${REMOTE_PATH}/dist`,
        `echo "✅ Legal pages are now LIVE on o2oeg.com!"`
      ];

      const executeNext = (index) => {
        if (index >= commands.length) {
          conn.end();
          return;
        }
        const cmd = commands[index];
        console.log(`\n>>> ${cmd}`);
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
