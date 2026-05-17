const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106', port: 22, username: 'root', password: 'O2OEG_Secure_Shield_2026_#646'
};

const cmd = 'sed -i "s/server_name.*/server_name o2oeg.com www.o2oeg.com admin.o2oeg.com salon.o2oeg.com rsha-hmdy-byoty-salon-l9tx9.o2oeg.com test-salon-ai.o2oeg.com;/g" /etc/nginx/sites-enabled/o2oeg; nginx -t; systemctl reload nginx';

conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ Nginx explicitly updated for ALL salons!');
      conn.end();
    }).on('data', (data) => process.stdout.write(data.toString()))
      .stderr.on('data', (data) => process.stderr.write(data.toString()));
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
