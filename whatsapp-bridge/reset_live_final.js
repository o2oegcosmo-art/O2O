const { Client } = require('ssh2');
const fs = require('fs');

const HOST = '72.62.182.106';
const USER = 'u525164227'; // Hostinger user from worker config
const KEY_PATH = 'C:/Users/Goodm/.ssh/o2oeg_deploy_key';

const conn = new Client();
conn.on('ready', () => {
    console.log('🔄 Executing LIVE Reset for 01044167626...');
    
    const cmd = `cd /var/www/u525164227/backend && php artisan tinker --execute="App\\Models\\User::where('phone', '01044167626')->update(['password' => Hash::make('224466')]); echo 'LIVE_SUCCESS';"`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            conn.end();
        });
    });
}).on('error', e => {
    console.error('❌ SSH Error:', e.message);
}).connect({ 
    host: HOST, 
    port: 22, 
    username: USER, 
    privateKey: fs.readFileSync(KEY_PATH)
});
