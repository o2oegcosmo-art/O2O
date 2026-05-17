const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106', port: 22, username: 'root', password: 'O2OEG_Secure_Shield_2026_#646'
};

const cmd = 'php -r "opcache_reset();" && systemctl restart php8.3-fpm && systemctl restart nginx';

conn.on('ready', () => {
  console.log('🚀 Resetting Live Server Engine...');
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ Server Engine Reset Successfully!');
      conn.end();
    }).on('data', (data) => process.stdout.write(data.toString()))
      .stderr.on('data', (data) => process.stderr.write(data.toString()));
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
