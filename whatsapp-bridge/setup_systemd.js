const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

const bridgeService = `[Unit]
Description=O2OEG WhatsApp Bridge Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/o2oeg/whatsapp-bridge
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
StandardOutput=append:/var/www/o2oeg/whatsapp-bridge/bridge.log
StandardError=append:/var/www/o2oeg/whatsapp-bridge/error.log

[Install]
WantedBy=multi-user.target
`;

const workerService = `[Unit]
Description=O2OEG AI Queue Worker
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/o2oeg/backend
ExecStart=/usr/bin/php artisan queue:work --tries=3 --timeout=120
Restart=always
RestartSec=10
StandardOutput=append:/var/www/o2oeg/backend/storage/logs/worker.log
StandardError=append:/var/www/o2oeg/backend/storage/logs/worker_error.log

[Install]
WantedBy=multi-user.target
`;

console.log('🚀 MISSION: SET UP SYSTEMD SERVICES FOR AUTO-START');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  // Using temp files and moving them because cat > /etc/systemd/system/ is easier with SSH
  const commands = [
    // 1. Kill any manual processes first
    'pkill -9 node || true',
    'pkill -f artisan || true',
    
    // 2. Write Bridge Service
    `echo '${bridgeService.replace(/'/g, "'\\''")}' > /etc/systemd/system/o2oeg-bridge.service`,
    
    // 3. Write Worker Service
    `echo '${workerService.replace(/'/g, "'\\''")}' > /etc/systemd/system/o2oeg-worker.service`,
    
    // 4. Reload systemd daemon
    'systemctl daemon-reload',
    
    // 5. Enable services (for auto-start on boot)
    'systemctl enable o2oeg-bridge',
    'systemctl enable o2oeg-worker',
    
    // 6. Start services now
    'systemctl start o2oeg-bridge',
    'systemctl start o2oeg-worker',
    
    // 7. Check status
    'systemctl status o2oeg-bridge --no-pager',
    'systemctl status o2oeg-worker --no-pager'
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
      console.log('\n✅ SERVICES INSTALLED AND ENABLED!');
      conn.end();
      return;
    }
    const cmd = commands[index];
    console.log(`\n>>> Executing: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error('Error:', err); conn.end(); return; }
      stream.on('data', (data) => process.stdout.write(data.toString()))
            .stderr.on('data', (data) => process.stderr.write(data.toString()))
            .on('close', () => executeNext(index + 1));
    });
  };
  executeNext(0);
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
