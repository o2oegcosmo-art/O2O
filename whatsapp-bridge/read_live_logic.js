const { Client } = require('ssh2');
const config = { host: '72.62.182.106', port: 22, username: 'root', password: 'O2OEG_Secure_Shield_2026_#646', readyTimeout: 30000 };
const conn = new Client();
conn.on('ready', () => {
    console.log('--- READING LIVE CODE ---');
    const files = [
        '/var/www/o2oeg/backend/routes/api.php',
        '/var/www/o2oeg/backend/app/Http/Controllers/Api/LeadController.php',
        '/var/www/o2oeg/backend/app/Http/Controllers/Api/AuthController.php'
    ];
    let index = 0;
    const readNext = () => {
        if (index >= files.length) { conn.end(); return; }
        console.log(`\n\n--- FILE: ${files[index]} ---`);
        conn.exec(`cat ${files[index]}`, (err, stream) => {
            stream.on('data', d => process.stdout.write(d));
            stream.on('close', () => { index++; readNext(); });
        });
    };
    readNext();
}).connect(config);
