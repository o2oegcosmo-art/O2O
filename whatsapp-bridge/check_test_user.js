const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

conn.on('ready', () => {
  // Read the actual stored hash to see what's in the DB
  conn.exec(`mysql -u o2o_user -pAmzabola@224466 o2oeg -e "SELECT phone, SUBSTR(password,1,10) as hash_start, LENGTH(password) as hash_len FROM users WHERE phone='01099999999';"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
          .on('data', (data) => console.log(data.toString()))
          .stderr.on('data', (data) => { if(!data.toString().includes('Warning')) console.log('ERR: '+data); });
  });
}).on('error', (err) => console.error('❌', err)).connect(config);
