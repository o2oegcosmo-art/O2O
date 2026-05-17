const { Client } = require('ssh2');

const HOST = '72.62.182.106';
const USER = 'root';
const PASSWORD = 'O2OEG_Secure_Shield_2026_#646';

const conn = new Client();
conn.on('ready', () => {
    console.log('🔄 Force resetting password for 01044167626...');
    
    // Creating a PHP script on the fly to reset the password
    const phpScript = `<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$user = App\\Models\\User::where('phone', '01044167626')->first();
if ($user) {
    $user->password = Illuminate\\Support\\Facades\\Hash::make('admin123');
    $user->save();
    echo "SUCCESS";
} else {
    echo "NOT_FOUND";
}
`;
    const base64Script = Buffer.from(phpScript).toString('base64');

    const cmd = `
        cd /var/www/o2oeg/backend
        echo "${base64Script}" | base64 -d > reset_pwd.php
        php reset_pwd.php
        rm reset_pwd.php
    `;
    
    conn.exec(cmd, (err, stream) => {
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
