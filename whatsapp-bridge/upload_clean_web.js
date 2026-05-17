const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

// ملف web.php نظيف بدون تكرار
const LOCAL_FILE = 'G:\\O2OEG AI-FIRST SAAS PLATFORM\\backend\\routes\\web.php';
const REMOTE_PATH = '/var/www/o2oeg/backend/routes/web.php';

console.log('🚀 Uploading clean web.php to live server...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    sftp.fastPut(LOCAL_FILE, REMOTE_PATH, (err) => {
      if (err) {
        console.error('❌ Upload failed:', err.message);
        conn.end();
        return;
      }
      
      console.log('✅ web.php uploaded successfully!');
      
      // الآن نمسح الكاش فقط (بدون optimize لتجنب مشكلة الـ timeout)
      conn.exec('cd /var/www/o2oeg/backend && php artisan config:clear && php artisan route:clear && php artisan cache:clear', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
          console.log('🔥 Cache cleared! Site is LIVE again.');
          conn.end();
        }).on('data', (data) => process.stdout.write(data.toString()))
          .stderr.on('data', (data) => process.stderr.write(data.toString()));
      });
    });
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
