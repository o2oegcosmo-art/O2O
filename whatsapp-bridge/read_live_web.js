const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

conn.on('ready', () => {
  conn.exec('cat /var/www/o2oeg/backend/routes/web.php', (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', () => {
      console.log(output);
      conn.end();
    }).on('data', (data) => {
      output += data.toString();
    });
  });
}).connect(config);
