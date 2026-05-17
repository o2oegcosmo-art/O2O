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
    console.log('--- USERS FOR RH BEAUTY SALON ---');
    conn.exec('mysql -u root -pO2OEG_Local_Secure_2026 o2oeg -N -s -e "SELECT name, phone, email, role FROM users WHERE tenant_id = \'019e214e-e3e8-7303-9ea3-018198ceb457\';"', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            conn.end();
        });
    });
}).on('error', e => console.error(e)).connect(config);
