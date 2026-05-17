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
    console.log('✅ Connected to LIVE server as ROOT with Password!');
    
    const cmd = `
        ROOT="/var/www/o2oeg/backend"
        if [ ! -d "$ROOT" ]; then ROOT="/var/www/u525164227/backend"; fi
        
        if [ -d "$ROOT" ]; then
            echo "Found ROOT: $ROOT"
            cd "$ROOT"
            /usr/bin/php artisan tinker --execute="App\\Models\\User::where('phone', '01044167626')->update(['password' => Hash::make('224466')]);"
            echo "--- RESET COMMAND EXECUTED ---"
        else
            echo "ERROR: Backend ROOT not found!"
        fi
    `;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\n✅ Connection Closed.');
            conn.end();
        });
    });
}).on('error', e => {
    console.error('❌ SSH Error:', e.message);
}).connect(config);
