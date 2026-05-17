const { Client } = require('ssh2');

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const conn = new Client();
conn.on('ready', () => {
  console.log('📡 Connected for FINAL VALIDATION...');
  
  // Checking 3 key fingerprints of our new code
  const cmd = `
    echo "1. Checking AIRouterService (lastRawText):" && grep "lastRawText" /var/www/o2oeg/backend/app/Services/AIRouterService.php | head -n 1
    echo "2. Checking WillAIController (raw_text):" && grep "raw_text" /var/www/o2oeg/backend/app/Http/Controllers/Api/WillAIController.php | head -n 1
    echo "3. Checking WhatsApp Bridge URL:" && grep "o2oeg.com/api/webhooks/whatsapp" /var/www/o2oeg/whatsapp-bridge/index.js
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (d) => { process.stdout.write(d); });
    stream.on('close', () => {
      console.log('\n✅ VALIDATION FINISHED!');
      conn.end();
    });
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
