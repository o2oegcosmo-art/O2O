const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

conn.on('ready', () => {
  console.log('📡 Connected for SQL Fix');
  const sql = "SELECT id FROM leads WHERE phone='01099999999' ORDER BY created_at DESC LIMIT 1; UPDATE leads SET status='accepted' WHERE phone='01099999999';";
  conn.exec(`mysql -u o2o_user -pAmzabola@224466 o2oeg -e "${sql}"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
