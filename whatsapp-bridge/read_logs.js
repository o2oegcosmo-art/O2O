const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

conn.on('ready', () => {
  console.log('📡 Connected - Reading last 50 lines of Laravel log');
  conn.exec('tail -n 80 /var/www/o2oeg/backend/storage/logs/laravel.log', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
          .on('data', (data) => console.log(data.toString()))
          .stderr.on('data', (data) => console.log('STDERR: ' + data));
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
