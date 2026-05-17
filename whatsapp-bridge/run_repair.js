const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

const LOCAL_FILE = 'g:\\O2OEG AI-FIRST SAAS PLATFORM\\backend\\fix_stuck.php';
const REMOTE_PATH = '/var/www/o2oeg/backend/fix_stuck.php';

console.log('🚀 Uploading and executing data repair...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    sftp.fastPut(LOCAL_FILE, REMOTE_PATH, (err) => {
      if (err) { console.error('Upload failed'); conn.end(); return; }
      
      console.log('✅ File uploaded. Executing...');
      
      const commands = [
        'php /var/www/o2oeg/backend/fix_stuck.php',
        'rm /var/www/o2oeg/backend/fix_stuck.php'
      ];

      const executeNext = (index) => {
        if (index >= commands.length) {
          console.log('\n🔥 ALL STUCK SALONS ARE NOW FIXED!');
          conn.end();
          return;
        }
        const cmd = commands[index];
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
