const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

conn.on('ready', () => {
  console.log('📡 Connected');
  conn.exec('cat /var/www/o2oeg/backend/.env | grep DB_', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
          .on('data', (data) => console.log('STDOUT: ' + data))
          .stderr.on('data', (data) => console.log('STDERR: ' + data));
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
