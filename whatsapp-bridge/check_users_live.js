const { Client } = require('ssh2');

const HOST = '72.62.182.106';
const USER = 'root';
const PASSWORD = 'O2OEG_Secure_Shield_2026_#646';

const conn = new Client();
conn.on('ready', () => {
    console.log('🔍 Checking users on live server...');
    // Using mysql -N -s to get raw tab-separated output
    conn.exec('mysql -u root -pO2OEG_Local_Secure_2026 o2oeg -N -s -e "SELECT phone, email, role FROM users;"', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            conn.end();
        });
    });
}).on('error', e => {
    console.error('❌ Connection error:', e.message);
}).connect({ host: HOST, port: 22, username: USER, password: PASSWORD });
