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
    console.log('✅ Fixing Notifications Patch (Class Resolution)...');
    
    const phpPatch = `<?php
$filePath = '/var/www/o2oeg/backend/app/Http/Controllers/Api/AuthController.php';
$content = file_get_contents($filePath);

// Use the already imported WhatsAppService class directly
$content = str_replace('new \\App\\Services\\WhatsAppService()', 'new WhatsAppService()', $content);

file_put_contents($filePath, $content);
echo "SUCCESS_FIXED";
?>`;

    const base64Script = Buffer.from(phpPatch).toString('base64');
    const cmd = `echo "${base64Script}" | base64 -d > /tmp/fix_auth.php && php /tmp/fix_auth.php && rm /tmp/fix_auth.php`;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\n✅ Fix Applied.');
            conn.end();
        });
    });
}).on('error', e => {
    console.error('❌ SSH Error:', e.message);
}).connect(config);
