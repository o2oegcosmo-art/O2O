const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'Amzabola@224466',
  readyTimeout: 30000
};

const ROOT = '/var/www/o2oeg';

console.log('🔧 Updating Production Server with Affiliate Conversion Fix...\n');

function runCmd(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> ${cmd}`);
    console.log('─'.repeat(70));
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', d => { const s = d.toString(); out += s; process.stdout.write(s); });
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
      stream.on('close', () => resolve(out.trim()));
    });
  });
}

conn.on('ready', async () => {
  console.log('✅ Connected to Server!\n');
  try {
    // 1. Pull the latest code
    await runCmd(conn, `cd ${ROOT} && git fetch origin main && git reset --hard origin/main`);

    // 2. Clear caches
    await runCmd(conn, `cd ${ROOT}/backend && php artisan config:clear && php artisan cache:clear && php artisan route:clear`);

    console.log('\n\n✅ Server successfully updated with Affiliate fixes!');
  } catch (e) {
    console.error('Error:', e.message);
  }
  conn.end();
}).on('error', err => console.error('SSH Error:', err.message)).connect(config);
