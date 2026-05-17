const { Client } = require('ssh2');
const fs = require('fs');

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646',
  readyTimeout: 30000
};

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected for ULTIMATE FILE FIX...');
    
    // Read the current file content
    conn.exec('cat /var/www/o2oeg/backend/app/Http/Controllers/Api/AuthController.php', (err, stream) => {
        let content = '';
        stream.on('data', d => content += d);
        stream.on('close', () => {
            console.log('📖 File read. Fixing content...');
            
            // Fix the broken class names
            content = content.replace(/new AppServicesWhatsAppService\(\)/g, 'new WhatsAppService()');
            content = content.replace(/IlluminateSupportFacadesLog/g, '\\Illuminate\\Support\\Facades\\Log');
            content = content.replace(/catch \(Exception \$e\)/g, 'catch (\\Exception $e)');

            // Prepare base64 of fixed content
            const base64Content = Buffer.from(content).toString('base64');
            const writeCmd = `echo "${base64Content}" | base64 -d > /var/www/o2oeg/backend/app/Http/Controllers/Api/AuthController.php`;
            
            conn.exec(writeCmd, (err, stream) => {
                stream.on('close', () => {
                    console.log('✅ File fixed and written back.');
                    conn.end();
                });
            });
        });
    });
}).on('error', e => {
    console.error('❌ SSH Error:', e.message);
}).connect(config);
