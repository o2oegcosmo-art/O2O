const { Client } = require('ssh2');

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const conn = new Client();
conn.on('ready', () => {
  console.log('📡 Connected! Scanning for project root...');
  conn.exec('find /var/www -name ".git" -maxdepth 3', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', (d) => { out += d; });
    stream.on('close', () => {
      console.log('\nFound Git Repos:');
      console.log(out);
      conn.end();
    });
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
