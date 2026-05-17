const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106', port: 22, username: 'root', password: 'O2OEG_Secure_Shield_2026_#646'
};

const cmd = 'grep "2026-05-14 20:16" /var/www/o2oeg/backend/storage/logs/laravel.log';

conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => process.stdout.write(data.toString()))
      .stderr.on('data', (data) => process.stderr.write(data.toString()));
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
