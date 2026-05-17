const { Client } = require('ssh2');

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646',
  readyTimeout: 30000
};

const conn = new Client();
conn.on('ready', () => {
    console.log('🧹 Cleaning up test users...');
    conn.exec('mysql -u root -pO2OEG_Local_Secure_2026 o2oeg -e "DELETE FROM tenants WHERE name = \'\u0635\u0627\u0644\u0648\u0646 \u0627\u0644\u062a\u062c\u0631\u0628\u0629 \u0627\u0644\u062a\u0642\u0646\u064a\u0629\';"', (err, stream) => {
        stream.on('close', () => {
            console.log('✅ Done.');
            conn.end();
        });
    });
}).connect(config);
