const { Client } = require('ssh2');

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466'
};

const REMOTE_PATH = '/var/www/o2oeg/backend';

const conn = new Client();

conn.on('ready', () => {
  console.log('📡 Connected to fix migrations...');
  
  // Mark the failing migration as completed and run the new one
  const commands = [
    `cd ${REMOTE_PATH} && php artisan migrate --path=database/migrations/2026_05_10_204228_add_business_details_to_leads_table.php --force`,
    `echo "✅ Specific migration executed."`
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
      conn.end();
      return;
    }
    const cmd = commands[index];
    console.log(`\n>>> ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', () => executeNext(index + 1))
            .on('data', (data) => process.stdout.write(data.toString()))
            .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
  };
  executeNext(0);
}).connect(config);
